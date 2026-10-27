lib.locale()

--[[
  Live config readers.

  Every one of these reads the `scriptConfig` global rather than calling
  `scriptConfig.get()` — the getter deadlocks if it is reached while a module
  is still loading, and these are called from exactly that kind of place.
  Anything that has to REACT to an edit uses `lib.scriptConfig.on` instead.
]]

---@return table
function getBasic()
  return scriptConfig?.basic or {}
end

---@return table[] every payment method the server has configured
function getPaymentMethods()
  return scriptConfig?.paymentMethods or {}
end

---@return table[] every store the config panel knows about
function getStoresConfig()
  return scriptConfig?.stores or {}
end

---@return table[] the licences this city issues
function getLicenses()
  return scriptConfig?.licenses or {}
end

--- The colours this resource's screens use, before any single store overrides
--- them. dirk_lib's global theme unless the Theme tab has been switched on.
---@return table
function getBaseTheme()
  local theme = scriptConfig?.theme
  if theme and theme.useOverride then
    return {
      primaryColor = theme.primaryColor or lib.settings.primaryColor,
      primaryShade = theme.primaryShade or lib.settings.primaryShade,
      customTheme  = theme.customTheme or lib.settings.customTheme,
    }
  end

  return {
    primaryColor = lib.settings.primaryColor,
    primaryShade = lib.settings.primaryShade,
    customTheme  = lib.settings.customTheme,
  }
end

--- A store's colours: its own if it overrides, otherwise the resource's.
---@param store table
---@return table
function getStoreTheme(store)
  local base = getBaseTheme()
  local theme = store and store.theme

  if theme and theme.useOverride then
    return {
      primaryColor = theme.primaryColor or base.primaryColor,
      primaryShade = theme.primaryShade or base.primaryShade,
      customTheme  = base.customTheme,
    }
  end

  return base
end

--- Normalise a value the panel may store as one string or a list of them.
---@param value string|table|nil
---@return table|nil
function asList(value)
  if value == nil then return nil end
  if type(value) == 'table' then
    return next(value) and value or nil
  end
  return { value }
end
