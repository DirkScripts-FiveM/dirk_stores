--[[
  "Preview" on a store row in the config panel.

  Building a shop from a form and never seeing it until you walk across the map
  is a slow way to work, so the row has a button that opens the real screen with
  the real stock. It is the saved store, not the staged edits — so it shows what
  players are getting right now, which is the useful comparison while you edit.

  The panel is not a guard: `lib.callback` travels as a net event, so anyone can
  reach this. It checks permission itself.
]]
--[[
  A client-side failure, in the log a server owner actually reads.

  Nothing on a player's machine reaches the server console on its own, so a
  store that fails to open there is invisible: the player says "nothing
  happened" and the console is clean. The client reports it here instead.
]]
RegisterNetEvent('dirk_stores:clientError', function(storeId, message)
  local src = source
  lib.print.error(('[client %s] store "%s" failed to open: %s')
    :format(src, tostring(storeId), tostring(message)))
end)

lib.callback.register('dirk_stores:admin:previewStore', function(src, data)
  if not lib.scriptConfig.hasPerm(src) then
    return { success = false, error = 'NoPermission' }
  end

  -- The button sits on the store's NAME, because the id field is generated and
  -- read-only, so that is what arrives. Ids are still tried first: a store
  -- called the same as another's id should not shadow it.
  local wanted = type(data) == 'table' and data.value or data
  local store = Store.get(wanted)

  if not store then
    for _, candidate in pairs(Store.getAllClient()) do
      if candidate.name == wanted then
        store = Store.get(candidate.id)
        break
      end
    end
  end

  if not store then
    return { success = false, error = ('No store called "%s" is running yet — save your changes first.'):format(tostring(wanted)) }
  end

  TriggerClientEvent('dirk_stores:previewStore', src, store.id)
  return { success = true, message = ('Opening %s'):format(store.name or store.id) }
end)
