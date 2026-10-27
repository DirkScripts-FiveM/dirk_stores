--[[
  GET_SETTINGS and GET_LOCALES are registered for us by '@dirk_lib/init.lua',
  which runs inside this resource's own scope for any resource with a ui_page.
  Registering our own copies here would shadow the shared ones while sending a
  narrower set of fields — which is how a NUI ends up missing `currency` and
  the framework name and nobody notices.
]]

AddEventHandler('onResourceStop', function(resource)
  if resource ~= cache.resource then return end
  TriggerScreenblurFadeOut(500)
end)

local function loadStores()
  local stores = lib.callback.await('dirk_stores:getStores')
  for _, data in ipairs(stores or {}) do
    Store.register(data)
  end
end

-- `lib.onCache` calls back straight away with the value the cache already
-- holds, so this covers both a fresh login and a resource restart while the
-- player is already in — no polling, and nothing to miss.
lib.onCache('playerLoaded', function(loaded)
  if not loaded then return end
  loadStores()
end)

--[[
  Whether a shopkeeper is opened by targeting or by the interaction prompt is
  decided when the ped spawns, so changing it in the panel has to put the peds
  back — otherwise the setting reads as saved and does nothing until a restart.
]]
local lastInteract
lib.scriptConfig.on('basic', function(basic)
  local interact = basic and basic.interact
  if interact == lastInteract then return end

  local first = lastInteract == nil
  lastInteract = interact
  if first then return end

  for _, store in pairs(Store.getAll()) do
    store:destroyPeds()
    store:spawnPed()
  end
end)
