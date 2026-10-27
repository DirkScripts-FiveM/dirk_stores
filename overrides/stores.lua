--[[
  Per-store behaviour, keyed by the store id in the config panel's Stores tab.

  Store DATA — name, locations, shopkeeper, blip, hours, categories, stock,
  which payment methods it takes, which jobs and licences may shop there —
  lives in the panel, and can be edited in game. None of it belongs here.

  This file is for the things a form cannot say: a condition with reasons, a
  side effect, a hook into another resource. A store with no entry here is
  simply always open to anyone the panel allows.

    canOpen     = function(src)                        -> boolean, reason?
    canExchange = function(src, cart, total)           -> boolean, reason?
    onExchange  = function(src, cart, total)           -> boolean, reason?

  `reason` is a locale key from this resource's locales/*.json, so what the
  player is told is translated like everything else.

  `canOpen` runs before the store opens. `canExchange` runs before any money
  or items move, so it is where you refuse a sale. `onExchange` runs after
  payment has been taken and before the goods are handed over — returning
  false there stops the goods, so only refuse for something you could not have
  known earlier.
]]

return {
  -- ammunation = {
  --   canOpen = function(src)
  --     if not lib.player.hasLicense(src, 'weapon') then
  --       return false, 'StoreAccessDeniedLicense'
  --     end
  --     return true
  --   end,
  --
  --   onExchange = function(src, cart, total)
  --     exports.dirk_logs:record(src, 'ammunation', total)
  --     return true
  --   end,
  -- },
}
