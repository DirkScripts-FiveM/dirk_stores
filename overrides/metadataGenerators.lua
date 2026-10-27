--[[
  Metadata for items that need to be unique, keyed by item name.

  Most items are interchangeable — one bottle of water is every bottle of
  water. A phone is not: it needs an IMEI that belongs to the person who bought
  it. Give the item name a function here and it is called once per unit sold,
  and whatever it returns is attached to that one item.

    [itemName] = function(src) -> table | nil

  Returning nil fails the sale rather than handing over a broken item, so a
  generator that talks to another resource should check that resource is there.

  The example below is commented out because dirk_burnerphone is not a
  dependency of this resource — uncomment it if you run it.
]]

return {
  -- flip_phone = function(src)
  --   if GetResourceState('dirk_burnerphone') ~= 'started' then return nil end
  --   local newPhone = exports.dirk_burnerphone:registerPhone({ model = 'flip' })
  --   if not newPhone then return nil end
  --   return { imei = newPhone.imei, model = 'flip' }
  -- end,
}
