--[[
  Who may shop, and who may buy a particular line.

  Two kinds of lock, and they are asked differently:

  * **Jobs and gangs** are a map of group name to the minimum rank — `{ police
    = 2 }` means an officer of rank 2 or above. The framework bridge already
    understands that shape, so it goes straight through.

  * **Licences** are a list of ids from the Licences tab. There is no standard
    licence system, so each id is asked of `overrides/licenses.lua` first and of
    the framework second.
]]

local licenceOverrides = require 'overrides.licenses'

--- Is this player in one of these groups, at the rank it asks for?
---@param src number
---@param groups table|nil  group name -> minimum grade
---@return boolean
function hasGroups(src, groups)
  if type(groups) ~= 'table' or not next(groups) then return true end
  return lib.player.hasGroup(src, groups) and true or false
end

--- Does this player hold every licence in the list?
---@param src number
---@param licences table|nil  list of licence ids
---@return boolean, string|nil the id they are missing
function hasLicences(src, licences)
  if type(licences) ~= 'table' then return true end

  for _, id in ipairs(licences) do
    local override = licenceOverrides[id]
    local held

    if override then
      local ok, result = pcall(override, src)
      if not ok then
        lib.print.error(('Licence check for "%s" errored: %s'):format(id, tostring(result)))
        return false, id
      end
      held = result and true or false
    else
      held = lib.player.hasLicense(src, id) and true or false
    end

    if not held then return false, id end
  end

  return true
end

--- What the Licences tab calls this one, for telling the player what they need.
---@param id string
---@return string
function licenceLabel(id)
  for _, licence in ipairs(getLicenses()) do
    if licence.id == id then return licence.label or licence.id end
  end
  return id
end
