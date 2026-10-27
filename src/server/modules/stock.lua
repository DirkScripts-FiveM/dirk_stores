--[[
  Live stock, for a store whose shelves another resource keeps.

  Stock set in the config panel is the STARTING amount — this is how a supplier
  script, a restock timer or a heist tops it up or empties it while the server
  runs. Nothing here is written back to the config, so a restart returns every
  store to what the panel says.
]]

function Store:updateStock(newStock)
  self.stock = newStock
  if not self:sanitizeItems() then return false end
  self:pushStockToShoppers()
  return true
end

function Store:getItemByListingId(id)
  for _, line in ipairs(self.stock) do
    if line.id == id then return line end
  end
end

function Store:updateStockByListingId(id, amount)
  local line = self:getItemByListingId(id)
  if not line or not line.stock then return end
  line.stock = math.max(0, line.stock + amount)
end

--- Anyone with this store open is looking at a list that just changed.
function Store:pushStockToShoppers()
  for src in pairs(self.usingStore or {}) do
    local canAccess = self:canAccessStore(src)
    if canAccess then
      local _, stock = self:openStore(src)
      TriggerClientEvent('dirk_stores:updateStock', src, self.id, stock)
    end
  end
end

exports('updateStock', function(storeId, newStock)
  local store = Store.get(storeId)
  if not store then return false end
  return store:updateStock(newStock)
end)

exports('getStock', function(storeId)
  local store = Store.get(storeId)
  return store and store.stock or nil
end)
