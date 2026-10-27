--[[
  Does this player hold a licence? Keyed by the licence id in the Licences tab.

  There is no standard licence system in FiveM. dirk_lib knows how to ask the
  common frameworks, and that is what runs when there is no entry here — so on
  a normal QB/QBX/ESX server this file stays empty and licences just work.

  Add a function when your city issues licences some other way: a separate
  licence resource, an inventory item that IS the licence, a metadata flag, a
  Discord role.

    [licenceId] = function(src) -> boolean

  Returning false stops the store, or greys the line, with whatever the Licences
  tab calls that licence.
]]

return {
  -- A licence that is really an item in the player's pocket:
  -- firearms = function(src)
  --   return (lib.inventory.hasItem(src, 'weaponlicense') or 0) > 0
  -- end,

  -- A licence another resource owns:
  -- pilot = function(src)
  --   return exports.my_licences:has(src, 'pilot')
  -- end,
}
