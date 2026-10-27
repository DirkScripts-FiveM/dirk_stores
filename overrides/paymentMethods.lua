--[[
  Payment behaviour, keyed by the method id in the config panel's Payment tab.

  The panel owns the DATA — a method's name, symbol, icon, and whether it is a
  framework account or an inventory item. That covers almost everything: a
  server that wants a "chips" currency adds a row and picks an account, with no
  code at all.

  This file is for the rest: a currency that is not simply an account or an
  item, or one that behaves differently per framework. Give a method any of
  `add`, `remove` or `get` and yours is used instead of the built-in.

    add    = function(src, amount)            -> boolean
    remove = function(src, amount)            -> boolean, reason?
    get    = function()  -- CLIENT side       -> number

  `get` runs on the client, because the balance is drawn on the payment switch
  before anything is bought. The other two run on the server.
]]

return {
  -- Black money is the one built-in that is not the same thing everywhere:
  -- ESX keeps it as an account, QB and QBX keep it as an item. The config row
  -- can only say one of those, so it says the ESX shape and this decides.
  black_money = {
    add = function(src, amount)
      if lib.settings.framework == 'es_extended' then
        return lib.player.addMoney(src, 'black_money', amount)
      end
      return lib.inventory.addItem(src, 'markedbills', amount)
    end,

    remove = function(src, amount)
      if lib.settings.framework == 'es_extended' then
        return lib.player.removeMoney(src, 'black_money', amount)
      end
      local has = lib.inventory.hasItem(src, 'markedbills') or 0
      if has < amount then return false, 'PaymentFailedNoMoney' end
      return lib.inventory.removeItem(src, 'markedbills', amount)
    end,

    get = function()
      if lib.settings.framework == 'es_extended' then
        return lib.player.getMoney('black_money') or 0
      end
      return lib.inventory.hasItem('markedbills') or 0
    end,
  },
}
