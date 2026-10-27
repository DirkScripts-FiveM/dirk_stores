--[[
  Answering ox_inventory's shop exports, so a script written against ox opens
  a dirk store instead.

  Overriding an export REPLACES it for the whole server — the last handler to
  answer `__cfx_export_*` is the one every caller gets. So this captures
  ox_inventory's own function first and delegates to it for anything that is
  not a dirk store. Without that, turning the setting off — or simply opening
  your own inventory — reached a handler that returned nothing, and
  ox_inventory silently stopped opening at all.
]]

local function captureExport(exportName)
  local original
  TriggerEvent(('__cfx_export_ox_inventory_%s'):format(exportName), function(fn)
    original = fn
  end)
  return original
end

local function overrideExport(exportName, func)
  AddEventHandler(('__cfx_export_ox_inventory_%s'):format(exportName), function(setCB)
    setCB(func)
  end)
end

--- Install the override once, the first time the setting asks for it.
local registered = {}
local function installOnce(exportName, build)
  if registered[exportName] then return end
  if GetResourceState('ox_inventory') ~= 'started' then return end

  local original = captureExport(exportName)
  registered[exportName] = true
  overrideExport(exportName, build(original))
end

--[[
  Watch from a THREAD, never at module load.

  This is a shared script, so it loads before the client files do — and
  `lib.scriptConfig.on` reads the current value as it registers, which on the
  client triggers scriptConfig's lazy load. Doing that during module load
  deadlocks the load, and the symptom is not an error: every client file after
  this one simply never runs, so there are no stores, no shopkeepers and no
  target option, on a clean console.
]]
local function whenCatchingOxStores(install)
  CreateThread(function()
    lib.scriptConfig.on('basic', function(basic)
      if basic and basic.catchOxStores then install() end
    end)
  end)
end

if lib.context == 'client' then
  whenCatchingOxStores(function()
    installOnce('openInventory', function(original)
      return function(invType, data, ...)
        -- Only a shop is ours to answer. Your own inventory, a stash, a
        -- glovebox and everything else go back to ox untouched.
        if not getBasic().catchOxStores or invType ~= 'shop' then
          return original and original(invType, data, ...)
        end

        local store = Store.get(data and data.type)
        if not store then
          return original and original(invType, data, ...)
        end

        if data.id and store.locations and not store.locations[tonumber(data.id)] then
          lib.print.warn(('ox shop %s asked for location %s, which this store does not have'):format(tostring(data.type), tostring(data.id)))
        end

        store:openStore()
      end
    end)
  end)

  return
end

whenCatchingOxStores(function()
  installOnce('RegisterShop', function(original)
    return function(shopId, data, ...)
      if not getBasic().catchOxStores or type(data) ~= 'table' then
        return original and original(shopId, data, ...)
      end

      -- ox describes a shop with `inventory`, one price per line and no
      -- categories. Everything else a dirk store has is optional, so the
      -- shape maps across directly.
      local stock = {}
      for _, line in ipairs(data.inventory or {}) do
        stock[#stock + 1] = {
          name  = line.name,
          price = line.price,
          stock = line.count,
        }
      end

      local locations = {}
      for _, position in ipairs(data.locations or {}) do
        locations[#locations + 1] = { x = position.x, y = position.y, z = position.z, w = 0.0 }
      end

      local groups
      if type(data.groups) == 'table' then
        groups = {}
        for group in pairs(data.groups) do groups[#groups + 1] = group end
      end

      Store.register({
        id             = shopId,
        type           = 'buy',
        name           = data.name or shopId,
        description    = '',
        icon           = 'fas fa-store',
        locations      = locations,
        groups         = groups,
        stock          = stock,
        paymentMethods = { 'cash', 'bank' },
      })
    end
  end)
end)
