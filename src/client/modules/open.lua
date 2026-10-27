local openStore = nil

--- Is the shopkeeper there at this hour? Mirrors the server's own check —
--- this one only decides whether the prompt and blip show.
function Store:isOpenNow()
  -- A store with hours switched off is simply always open; the range is only
  -- read when the switch says to read it.
  if not self.openingHoursEnabled then return true end

  local hours = self.openingHours
  if type(hours) ~= 'table' or not hours[1] then return true end

  local openHour, closeHour = hours[1], hours[2]
  if openHour == closeHour then return true end

  local hour = GetClockHours()
  return (openHour <= closeHour and hour >= openHour and hour < closeHour)
      or (openHour > closeHour and (hour >= openHour or hour < closeHour))
end

--[[
  The payment methods arrive already resolved — name, symbol and icon — from
  the server, which is the side that always has the config. Nothing to do here
  but make sure the field is a table so the NUI never gets nil.
]]
function Store:sanitizePaymentMethods()
  if type(self.paymentMethods) ~= 'table' then
    self.paymentMethods = {}
  end

  if #self.paymentMethods == 0 then
    lib.print.warn(('Store %s accepts no payment method anyone can use'):format(self.id))
  end
end

--[[
  A client-side failure that nobody can see is the worst kind.

  Everything below runs on the player's machine, so a mistake here shows up as
  "I pressed it and nothing happened" and leaves nothing in the server console
  — which is the only log a server owner actually reads. So the open is wrapped
  and anything that throws is reported to the server.
]]
function Store:openStore()
  local ok, err = pcall(function() return self:tryOpenStore() end)
  if not ok then
    TriggerServerEvent('dirk_stores:clientError', self.id, tostring(err))
    lib.print.error(('Opening store %s failed: %s'):format(tostring(self.id), tostring(err)))
  end
end

function Store:tryOpenStore()
  -- No group or licence check here. The client has neither the rank map nor
  -- the licence overrides, and a second opinion that disagrees with the server
  -- is worse than no opinion: the server answers with the reason regardless.
  local canOpen, stock, detail = lib.callback.await('dirk_stores:openStore', self.id)
  if not canOpen then
    return lib.notify({
      title = locale('StoreAccessDenied'),
      description = locale(stock or 'CannotOpenCustom', detail),
      type = 'error',
    })
  end

  self.stock = stock

  -- Balances are read here rather than on the server so a method backed by an
  -- inventory item reads the player's own inventory the same way the rest of
  -- the UI does.
  for _, method in ipairs(self.paymentMethods) do
    method.balance = Payment.balance(method)
  end

  openStore = self

  SendNUIMessage({
    action = 'OPEN_STORE',
    data = {
      id             = self.id,
      type           = self.type,
      name           = self.name,
      description    = self.description,
      icon           = self.icon,
      categories     = self.categories,
      paymentMethods = self.paymentMethods,
      stock          = self.stock,
      background     = getBasic().background or 'themed',
      theme          = getStoreTheme(self),
    },
  })

  TriggerScreenblurFadeIn(500)
  SetNuiFocus(true, true)
end

function Store:closeStore()
  while IsScreenblurFadeRunning() do Wait(0) end
  TriggerScreenblurFadeOut(0)
  SetNuiFocus(false, false)
  SendNUIMessage({ action = 'CLOSE_STORE' })
  TriggerServerEvent('dirk_stores:closeStore', self.id)
  openStore = nil
end

--[[
  "Preview" from the config panel.

  Opens the real screen for the store being edited, so a shop built from a form
  can be looked at without walking to it. The panel is left as it is underneath
  — closing the store puts you straight back on the row you were editing.
]]
RegisterNetEvent('dirk_stores:previewStore', function(storeId)
  local store = Store.get(storeId)
  if not store then return end
  store:openStore()
end)

--- The shelves changed while somebody was looking at them.
RegisterNetEvent('dirk_stores:updateStock', function(storeId, stock)
  if not openStore or openStore.id ~= storeId then return end
  openStore.stock = stock
  SendNUIMessage({ action = 'UPDATE_STOCK', data = { stock = stock } })
end)

RegisterNuiCallback('MAKE_TRANSACTION', function(data, cb)
  if not openStore then
    return cb({ success = false, error = 'StoreNotFound' })
  end

  if not openStore:isOpenNow() then
    return cb({ success = false, error = 'StoreClosed' })
  end

  local success, reason = lib.callback.await('dirk_stores:attemptTransaction', openStore.id, data.cart, data.method)
  if success then openStore:closeStore() end

  cb({ success = success, error = reason })
end)

RegisterNuiCallback('CLOSE_STORE', function(_, cb)
  if not openStore then
    return cb({ success = false, error = 'StoreNotFound' })
  end
  openStore:closeStore()
  cb({ success = true })
end)
