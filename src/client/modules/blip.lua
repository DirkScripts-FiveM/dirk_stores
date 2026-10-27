local function blipKey(id, index)
  return ('Store:%s:%s'):format(id, index)
end

function Store:spawnBlip()
  -- No sprite means the server owner asked for no blip, which is a legitimate
  -- answer for a store you are supposed to hear about rather than find.
  if not self.blip or not self.blip.sprite then return end

  for index, location in ipairs(self.locations or {}) do
    lib.blip.register(blipKey(self.id, index), {
      pos        = vector3(location.x, location.y, location.z),
      name       = self.name,
      sprite     = self.blip.sprite,
      display    = self.blip.display or 4,
      scale      = self.blip.scale or 0.8,
      color      = self.blip.color,
      shortRange = self.blip.shortRange ~= false,

      canSee = self.openingHoursEnabled and function()
        return self:isOpenNow()
      end or nil,
    })
  end
end

function Store:destroyBlips()
  for index in ipairs(self.locations or {}) do
    lib.blip.destroy(blipKey(self.id, index))
  end
end
