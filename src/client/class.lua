local Stores = {}

Store = {}
Store.__index = Store

function Store:__init()
  self:sanitizePaymentMethods()
  self:spawnBlip()
  self:spawnPed()
  return true
end

Store.get = function(id)
  return Stores[id]
end

Store.getAll = function()
  return Stores
end

Store.register = function(data)
  if not data or not data.id then return nil end

  -- Re-registering an id is how an edit arrives, so tear the old one down
  -- first: its ped and blips are separate entities and nothing else removes
  -- them, which is how a moved store used to leave a shopkeeper behind.
  if Stores[data.id] then Store.destroy(data.id) end

  local self = setmetatable(data, Store)
  if not self:__init() then
    lib.print.error(('Store %s failed to initialize.'):format(self.id))
    return nil
  end

  Stores[self.id] = self
  return self
end

Store.destroy = function(id)
  local store = Stores[id]
  if not store then return end
  store:destroyBlips()
  store:destroyPeds()
  Stores[id] = nil
end

Store.destroyAll = function()
  for id in pairs(Stores) do Store.destroy(id) end
end

--- One store was added, changed or removed.
RegisterNetEvent('dirk_stores:updateStore', function(id, data)
  if data then
    Store.register(data)
  else
    Store.destroy(id)
  end
end)

--- Every store at once, after a config save on the server.
RegisterNetEvent('dirk_stores:refreshStores', function(stores)
  local seen = {}
  for _, data in ipairs(stores or {}) do
    seen[data.id] = true
    Store.register(data)
  end
  for id in pairs(Stores) do
    if not seen[id] then Store.destroy(id) end
  end
end)

AddEventHandler('onResourceStop', function(resource)
  if resource ~= cache.resource then return end
  Store.destroyAll()
end)

exports('openStore', function(id)
  local store = Stores[id]
  if not store then return false end
  store:openStore()
  return true
end)
