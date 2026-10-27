--[[
  Paying, and being paid.

  A payment method is DATA in the config panel — a name, a symbol, an icon,
  and whether it moves a framework account or an inventory item. That covers
  the ordinary cases with no code. `overrides/paymentMethods.lua` supplies the
  rest, keyed by the same id, and wins wherever it defines something.
]]

local overrides = require 'overrides.paymentMethods'

Payment = {}

--- The configured method with this id, or nil if a store names one that has
--- since been deleted.
---@param id string
---@return table|nil
function Payment.get(id)
  for _, method in ipairs(getPaymentMethods()) do
    if method.id == id then return method end
  end
end

--[[
  What the NUI draws, plus what the client needs to read a balance.

  `kind`, `account` and `item` travel with it so the client never has to look
  the method up in its own scriptConfig copy — which is not guaranteed to have
  hydrated when a store arrives, and when it had not, every method was dropped
  and the store opened with no payment switch and no currency symbol. None of
  the three is a secret: they name a framework account or an inventory item.
]]
---@param method table
---@return table
function Payment.forClient(method)
  return {
    id      = method.id,
    name    = method.name or method.id,
    icon    = method.icon or 'fas fa-credit-card',
    symbol  = method.symbol or lib.settings.currency or '$',
    kind    = method.kind or 'account',
    account = method.account,
    item    = method.item,
  }
end

if lib.context == 'client' then
  --- What the player currently holds in this method.
  ---@param method table
  ---@return number
  function Payment.balance(method)
    local override = overrides[method.id]
    if override and override.get then
      local ok, amount = pcall(override.get)
      return ok and tonumber(amount) or 0
    end

    if method.kind == 'item' then
      return method.item and (lib.inventory.hasItem(method.item) or 0) or 0
    end

    return lib.player.getMoney(method.account or method.id) or 0
  end

  return
end

--- Give the player `amount` in this method.
---@param src number
---@param method table
---@param amount number
---@return boolean
function Payment.add(src, method, amount)
  local override = overrides[method.id]
  if override and override.add then
    return override.add(src, amount) and true or false
  end

  if method.kind == 'item' then
    if not method.item then return false end
    return lib.inventory.addItem(src, method.item, amount) and true or false
  end

  return lib.player.addMoney(src, method.account or method.id, amount) and true or false
end

--- Take `amount` off the player in this method.
---@param src number
---@param method table
---@param amount number
---@return boolean, string|nil reason
function Payment.remove(src, method, amount)
  local override = overrides[method.id]
  if override and override.remove then
    local removed, reason = override.remove(src, amount)
    return removed and true or false, reason
  end

  if method.kind == 'item' then
    if not method.item then return false, 'InvalidPaymentMethod' end
    local has = lib.inventory.hasItem(src, method.item) or 0
    if has < amount then return false, 'PaymentFailedNoMoney' end
    return lib.inventory.removeItem(src, method.item, amount) and true or false
  end

  local removed, reason = lib.player.removeMoney(src, method.account or method.id, amount)
  return removed and true or false, reason
end
