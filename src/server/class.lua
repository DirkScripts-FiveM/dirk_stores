local Stores = {}

Store = {}
Store.__index = Store

--- Stores that came from the config panel, so a later edit knows which rows it
--- owns and must not touch the ones another resource registered at runtime.
local fromConfig = {}

function Store:generateListingId()
  for _ = 1, 50 do
    local id = ('%s_%s'):format(self.id, math.random(1000, 9999))
    local taken = false
    for _, line in ipairs(self.stock) do
      if line.id == id then taken = true break end
    end
    if not taken then return id end
  end
  -- 50 collisions in a row means the store has thousands of lines; fall back
  -- to something that cannot collide rather than recursing forever.
  return ('%s_%s'):format(self.id, GetGameTimer())
end

local function titleCase(name)
  return name:gsub('_', ' '):gsub('(%l)(%w*)', function(a, b) return string.upper(a) .. b end)
end

function Store:sanitizeItems()
  local clean = {}

  for _, line in ipairs(self.stock or {}) do
    if not line.name then
      lib.print.warn(('Store %s has a stock line with no item — skipped'):format(self.id))
    elseif type(line.price) ~= 'number' then
      lib.print.warn(('Store %s: "%s" has no price — skipped'):format(self.id, line.name))
    else
      local entry = {
        name        = line.name,
        price       = line.price,
        stock       = line.stock,
        category    = line.category,
        groups      = asList(line.groups),
        licenses    = asList(line.licenses),
        metadata    = line.metadata,
        -- The label and description are the inventory's to give: an item
        -- renamed there should read the same in every shop that sells it.
        -- What is stored here is only the fallback.
        label       = line.label or lib.inventory.getItemLabel(line.name) or titleCase(line.name),
        description = line.description or '',
      }
      entry.id = self:generateListingId()
      clean[#clean + 1] = entry
    end
  end

  self.stock = clean
  return true
end

function Store:__init()
  if not self.id then
    lib.print.error('A store was registered with no id')
    return false
  end

  if not self.name then
    lib.print.warn(('Store %s has no name — using its id'):format(self.id))
    self.name = self.id
  end

  self.type = self.type == 'sell' and 'sell' or 'buy'
  self.description = self.description or ''
  self.icon = self.icon or 'fas fa-store'
  self.groups = asList(self.groups)
  self.licenses = asList(self.licenses)

  -- A store that names a payment method nobody configured would open with a
  -- switch the player cannot pay with, so drop those and say which.
  local methods = {}
  for _, id in ipairs(self.paymentMethods or {}) do
    if Payment.get(id) then
      methods[#methods + 1] = id
    else
      lib.print.warn(('Store %s accepts "%s", which is not in the Payment tab'):format(self.id, id))
    end
  end
  if #methods == 0 then
    lib.print.warn(('Store %s has no usable payment method — falling back to cash'):format(self.id))
    methods = { 'cash' }
  end
  self.paymentMethods = methods

  for _, category in ipairs(self.categories or {}) do
    if not category.name then
      lib.print.warn(('Store %s has a category with no name'):format(self.id))
    end
  end

  return self:sanitizeItems()
end

--[[
  `owner` names the resource the store belongs to, and is only passed by the
  config sync below. GetInvokingResource() cannot answer for it: the sync runs
  inside a scriptConfig watcher, whose call stack belongs to whichever resource
  happened to resume the thread — in practice oxmysql — so every config store
  registered as "from oxmysql" and would have been destroyed with it.
]]
Store.register = function(data, owner)
  local self = setmetatable(data, Store)
  self.resource = owner or GetInvokingResource() or GetCurrentResourceName()
  self.usingStore = {}

  if not self:__init() then
    lib.print.error(('Store %s failed to initialize.'):format(tostring(data.id)))
    return nil
  end

  Stores[self.id] = self

  -- Config stores are pushed to clients in one go by the sync below; anything
  -- registered at runtime has to announce itself.
  if self.resource ~= GetCurrentResourceName() then
    lib.print.info(('Store %s registered from resource %s'):format(self.id, self.resource))
    TriggerClientEvent('dirk_stores:updateStore', -1, self.id, self:getClientData())
  end

  return self
end

Store.destroy = function(id)
  local store = Stores[id]
  if not store then return end
  Stores[id] = nil
  fromConfig[id] = nil
  TriggerClientEvent('dirk_stores:updateStore', -1, id, nil)
end

Store.get = function(id)
  return Stores[id]
end

--[[
  Rebuild every store the config panel owns.

  Called once when settings first load and again on every save. Stores another
  resource registered through the export are left alone — this only owns what
  it put there, which is what `fromConfig` records.
]]
Store.syncFromConfig = function(rows)
  local seen = {}

  for _, row in ipairs(rows or {}) do
    if row.id then
      seen[row.id] = true
      -- A saved row is a fresh table every time, so registering over the top
      -- is a full replace — no stale stock lines from the previous version.
      local store = Store.register(lib.table.deepClone(row), GetCurrentResourceName())
      if store then fromConfig[row.id] = true end
    end
  end

  for id in pairs(fromConfig) do
    if not seen[id] then Store.destroy(id) end
  end

  Store.loaded = true
  TriggerClientEvent('dirk_stores:refreshStores', -1, Store.getAllClient())
end

--[[
  Ask for a rebuild without doing one per watcher.

  `stores` and `paymentMethods` both fire on first load and on any save that
  touches either, so calling sync directly rebuilt every store and broadcast
  the whole list twice for one edit. Coalescing to the next tick makes it once
  however many watchers asked.
]]
local syncQueued = false
Store.requestSync = function()
  if syncQueued then return end
  syncQueued = true

  CreateThread(function()
    Wait(0)
    syncQueued = false
    Store.syncFromConfig(getStoresConfig())
  end)
end

AddEventHandler('onResourceStop', function(resource)
  for id, store in pairs(Stores) do
    if store.resource == resource then Store.destroy(id) end
  end
end)

AddEventHandler('playerDropped', function()
  local src = source
  for _, store in pairs(Stores) do
    store.usingStore[src] = nil
  end
end)

--- The store's accepted methods, as the payment switch needs to draw them.
function Store:clientPaymentMethods()
  local methods = {}
  for _, id in ipairs(self.paymentMethods or {}) do
    local method = Payment.get(id)
    if method then methods[#methods + 1] = Payment.forClient(method) end
  end
  return methods
end

function Store:getClientData()
  return {
    id             = self.id,
    type           = self.type,
    name           = self.name,
    description    = self.description,
    icon           = self.icon,
    categories     = self.categories,
    models         = self.models,
    -- Resolved here, not on the client. The client used to look each id up in
    -- its own scriptConfig copy, which is not guaranteed to have hydrated when
    -- a store arrives — and when it had not, every method was dropped, so the
    -- screen opened with no payment switch and every price lost its symbol.
    paymentMethods = self:clientPaymentMethods(),
    blip           = self.blip,
    locations      = self.locations,
    openingHours        = self.openingHours,
    openingHoursEnabled = self.openingHoursEnabled,
    theme          = self.theme,
    licenses       = self.licenses,
    groups         = self.groups,
  }
end

Store.getAllClient = function()
  local ret = {}
  for _, store in pairs(Stores) do
    ret[#ret + 1] = store:getClientData()
  end
  return ret
end

lib.callback.register('dirk_stores:getStores', function()
  -- A player can load before the config does on a cold boot; waiting here is
  -- cheaper than handing them an empty world and never correcting it.
  local waited = 0
  while not Store.loaded and waited < 10000 do
    Wait(100)
    waited += 100
  end
  return Store.getAllClient()
end)

--[[
  Server-side usage from another resource.
]]
exports('getStore', Store.get)
exports('registerStore', Store.register)
exports('destroyStore', Store.destroy)
