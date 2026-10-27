local metadataGenerators = require 'overrides.metadataGenerators'
local storeOverrides = require 'overrides.stores'

--- Check the cart line by line before anything moves.
---@return boolean, string|nil reason, number total
function Store:priceCart(src, cart)
  local total = 0

  for _, entry in ipairs(cart) do
    local line = self:getItemByListingId(entry.id)
    if not line then return false, 'NoItemById', 0 end

    local quantity = math.floor(tonumber(entry.quantity) or 0)
    if quantity <= 0 then return false, 'NoItemById', 0 end

    if self:lineRestriction(src, line) then
      return false, 'ItemAccessDenied', 0
    end

    if self.type == 'sell' then
      if not lib.inventory.hasItem(src, line.name, quantity) then
        return false, 'NotEnoughItem', 0
      end
    elseif line.stock and quantity > line.stock then
      return false, 'OutOfStock', 0
    end

    total += line.price * quantity
  end

  return true, nil, total
end

function Store:attemptTransaction(src, cart, paymentMethodId)
  if type(cart) ~= 'table' or #cart == 0 then
    return false, 'EmptyCart'
  end

  local priced, reason, total = self:priceCart(src, cart)
  if not priced then return false, reason end

  local method = Payment.get(paymentMethodId)
  if not method then return false, 'InvalidPaymentMethod' end

  -- A store only offers the methods it accepts, but the request is a net
  -- event, so the client's word for which one was used is not enough.
  local accepted = false
  for _, id in ipairs(self.paymentMethods or {}) do
    if id == paymentMethodId then accepted = true break end
  end
  if not accepted then return false, 'InvalidPaymentMethod' end

  local override = storeOverrides[self.id]
  if override and override.canExchange then
    local allowed, why = override.canExchange(src, cart, total)
    if not allowed then return false, why or 'TransactionFailed' end
  end

  if self.type == 'sell' then
    -- Take the goods FIRST. Paying first and then failing to remove the item
    -- is the one ordering that hands out free money.
    for _, entry in ipairs(cart) do
      local line = self:getItemByListingId(entry.id)
      if not lib.inventory.removeItem(src, line.name, entry.quantity) then
        return false, 'SellItemFailedNoItem'
      end
    end

    if not Payment.add(src, method, total) then
      return false, 'TransactionFailed'
    end
  else
    local paid, why = Payment.remove(src, method, total)
    if not paid then return false, why or 'PaymentFailedNoMoney' end
  end

  if override and override.onExchange then
    local allowed, why = override.onExchange(src, cart, total)
    if not allowed then return false, why or 'TransactionFailed' end
  end

  for _, entry in ipairs(cart) do
    self:updateStockByListingId(entry.id, -entry.quantity)
  end

  if self.type == 'buy' then
    for _, entry in ipairs(cart) do
      local line = self:getItemByListingId(entry.id)
      local generator = metadataGenerators[line.name]

      if generator then
        -- A generated item is unique, so it is handed over one at a time.
        for _ = 1, entry.quantity do
          local metadata = generator(src)
          if not metadata then
            lib.print.error(('Metadata generator for item %s returned nil'):format(line.name))
            return false, 'MetadataGenerationFailed'
          end
          lib.inventory.addItem(src, line.name, 1, metadata)
        end
      else
        lib.inventory.addItem(src, line.name, entry.quantity, line.metadata)
      end
    end
  end

  lib.notify(src, {
    title = locale('TransactionComplete'),
    description = locale('TransactionCompleteMessage'),
    type = 'success',
  })

  return true
end

lib.callback.register('dirk_stores:attemptTransaction', function(src, storeId, cart, paymentMethodId)
  local store = Store.get(storeId)
  if not store then return false, 'StoreNotFound' end

  local canAccess, reason = store:canAccessStore(src)
  if not canAccess then
    lib.print.warn(('Player %s attempted to buy from store %s without access (%s)'):format(src, storeId, tostring(reason)))
    return false, reason or 'StoreAccessDenied'
  end

  return store:attemptTransaction(src, cart, paymentMethodId)
end)
