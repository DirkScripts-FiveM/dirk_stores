local storeOverrides = require 'overrides.stores'

function Store:ensureNearby(src)
  -- A store with no locations is opened by another resource's own logic
  -- (an export, an ox shop), so there is no counter to stand at.
  if not self.locations or #self.locations == 0 then return true end

  local playerPos = GetEntityCoords(GetPlayerPed(src))
  for _, location in pairs(self.locations) do
    if #(playerPos - vector3(location.x, location.y, location.z)) < 5.0 then
      return true
    end
  end

  return false, 'NotNearStore'
end

--[[
  Opening hours are checked on the CLIENT, not here.

  `GetClockHours` is a client native — there is no game clock on a FiveM
  server unless a weather-sync resource happens to publish one, and which
  resource that is differs per server. Calling it here threw on every open,
  and because the error made the callback return nothing, the player was told
  the generic "not serving right now" rather than anything true.

  So the hours gate the blip, the prompt and the open, all client-side, and
  the server does not pretend to know the time. A modified client could shop
  out of hours; it could not buy anything it is not allowed to buy, which is
  what the rest of these checks are for.
]]
function Store:canAccessStore(src)
  local nearby, reason = self:ensureNearby(src)
  if not nearby then return false, reason end

  if not hasGroups(src, self.groups) then
    return false, 'StoreAccessDeniedGroup'
  end

  local licensed, missing = hasLicences(src, self.licenses)
  if not licensed then
    return false, 'StoreAccessDeniedLicense', licenceLabel(missing)
  end

  local override = storeOverrides[self.id]
  if override and override.canOpen then
    local allowed, why = override.canOpen(src)
    if not allowed then return false, why or 'CannotOpenCustom' end
  end

  return true
end

--- Can this player buy this particular line?
---@return table|nil the reason it is greyed out, or nil when it is available
function Store:lineRestriction(src, line)
  -- `kind` rather than an icon class: the reason is the fact, and the screen
  -- decides how to draw it. A locked line looks different from an empty shelf.
  if not hasGroups(src, line.groups) then
    return { kind = 'group', message = locale('GroupRestricted') }
  end

  -- Name the licence they are short of. "You need a licence" tells a player
  -- nothing they can act on; "You need a Firearms Licence" does.
  local licensed, missing = hasLicences(src, line.licenses)
  if not licensed then
    return { kind = 'license', message = locale('LicenseRestrictedNamed', licenceLabel(missing)) }
  end
end

function Store:openStore(src)
  local canAccess, reason, detail = self:canAccessStore(src)
  if not canAccess then return false, reason, detail end

  self.usingStore[src] = true

  local selling = self.type == 'sell'
  local stock = {}

  for _, line in ipairs(self.stock) do
    local entry = {
      id          = line.id,
      name        = line.name,
      price       = line.price,
      category    = line.category,
      label       = line.label,
      description = line.description,
    }

    if selling then
      -- In a sell store "stock" is what the PLAYER has to offer, not what the
      -- shop holds — so a line they own none of is the one to grey out.
      local held = lib.inventory.hasItem(src, line.name) or 0
      entry.stock = held
      if held <= 0 then
        entry.disabled = { kind = 'stock', message = locale('DontHaveItem') }
      end
    else
      entry.stock = line.stock
      if line.stock and line.stock <= 0 then
        entry.disabled = { kind = 'stock', message = locale('OutOfStock') }
      end
    end

    entry.disabled = entry.disabled or self:lineRestriction(src, line)
    stock[#stock + 1] = entry
  end

  return true, stock
end

lib.callback.register('dirk_stores:openStore', function(src, storeId)
  local store = Store.get(storeId)
  if not store then return false, 'StoreNotFound' end
  return store:openStore(src)
end)

function Store:closedStore(src)
  self.usingStore[src] = nil
end

RegisterNetEvent('dirk_stores:closeStore', function(storeId)
  local store = Store.get(storeId)
  if not store then return end
  store:closedStore(source)
end)
