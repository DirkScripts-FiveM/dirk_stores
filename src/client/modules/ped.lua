local function pedKey(id, index)
  return ('StorePed:%s:%s'):format(id, index)
end

function Store:spawnPed()
  if not self.models or #self.models == 0 then return end

  for index, location in ipairs(self.locations or {}) do
    local model = self.models[math.random(#self.models)]

    lib.objects.register(pedKey(self.id, index), {
      type  = 'ped',
      model = model,
      -- Stored coordinates are the ground the player stood on; a ped is
      -- placed from its feet, so it sits a metre low without this.
      pos   = vector4(location.x, location.y, location.z - 1.0, location.w or 0.0),

      onSpawn = function(data)
        FreezeEntityPosition(data.entity, true)
        SetEntityInvincible(data.entity, true)
        SetBlockingOfNonTemporaryEvents(data.entity, true)

        local options = {
          {
            distance = 1.5,
            label = locale('OpenStore'),
            icon  = 'fas fa-store',

            canInteract = function()
              if not self:isOpenNow() then
                return false, locale('StoreClosed')
              end
              return true
            end,

            action = function()
              self:openStore()
            end,
          },
        }

        if cache.game == 'redm' then return end

        if getBasic().interact == 'interact' then
          lib.interact.entity(data.entity, {
            options = options,
            ignoreLos = true,
            distance = 2.5,
            renderDistance = 5.0,
          })
        else
          lib.target.entity(data.entity, {
            distance = 1.5,
            options = options,
          })
        end
      end,

      canSpawn = self.openingHoursEnabled and function()
        return self:isOpenNow()
      end or nil,
    })
  end
end

function Store:destroyPeds()
  for index in ipairs(self.locations or {}) do
    lib.objects.destroy(pedKey(self.id, index))
  end
end
