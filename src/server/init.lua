lib.checkDependency('dirk_lib', '1.2.5', true)

--[[
  Get out of the way of whatever shop system the framework shipped with.

  Two of these bind the same peds at the same counters, so leaving them running
  puts two shopkeepers on one till and gives the player two menus. Which ones
  exist depends on the framework, so the list is keyed by it rather than being
  one long guess.

  ox_inventory is deliberately NOT here. Its shops are part of the inventory —
  stopping it would take the inventory with it — and its shop list is read from
  its own `data/shops.lua` at start, which this resource has no business
  rewriting. Empty that file to remove those, or turn on "Catch ox stores" and
  let ox's own shopkeepers open a dirk store instead.
]]
local CONFLICTING = {
  ['qb-core']      = { 'qb-shops', 'qb-pawnshops' },
  ['qbx_core']     = { 'qbx_pawnshop' },
  ['es_extended']  = { 'esx_shops', 'esx_weashops' },
}

local function stopConflictingShops()
  local stopped = {}

  for _, resource in ipairs(CONFLICTING[lib.settings.framework] or {}) do
    if GetResourceState(resource) == 'started' then
      StopResource(resource)
      stopped[#stopped + 1] = resource
    end
  end

  if #stopped > 0 then
    lib.print.info(('Stopped %s — dirk_stores replaces it. Turn off "Stop the framework\'s own shops" in /dirk_stores to keep it.'):format(table.concat(stopped, ', ')))
  end

  if lib.settings.inventory == 'ox_inventory' then
    lib.print.info("ox_inventory ships its own shops in data/shops.lua and they cannot be stopped from here. Empty that file to remove them, or turn on \"Catch ox stores\" so its shopkeepers open a dirk store.")
  end
end

--[[
  Stores are rebuilt from the config whenever it changes — on first load
  (`source = 'initial'`) and again on every save from the panel, so a store
  added in game appears without a restart.

  `paymentMethods` is watched too: a store's accepted-methods list is validated
  against it at register time, so renaming a method has to re-run that or every
  store carries a reference to something that no longer exists.
]]
lib.scriptConfig.on('stores', function()
  Store.requestSync()
end)

lib.scriptConfig.on('paymentMethods', function()
  Store.requestSync()
end)

local checkedConflicts = false
lib.scriptConfig.on('basic', function(basic)
  -- Once per boot. A later save should not stop a resource the owner has
  -- since started back up on purpose.
  if checkedConflicts then return end
  checkedConflicts = true
  if basic and basic.stopConflictingShops then stopConflictingShops() end
end)
