fx_version 'cerulean'
lua54 'yes'
games { 'rdr3', 'gta5' }
rdr3_warning 'I acknowledge that this is a prerelease build of RedM, and I am aware my resources *will* become incompatible once RedM ships.'
author 'DirkScripts'
description 'Stores | Dirk Pack'
version      '1.2.0'

shared_script {
  '@dirk_lib/init.lua',
  'src/shared/utils.lua',
  'src/shared/payment.lua',
  'src/shared/bridging.lua',
}

server_script {
  -- scriptConfig persists to the database, and it waits on the `MySQL` global
  -- existing in THIS resource's VM. Without this line it waits forever and the
  -- only symptom is settings never loading.
  '@oxmysql/lib/MySQL.lua',
  'src/server/class.lua',
  'src/server/modules/*.lua',
  'src/server/init.lua',
}

client_script {
  'src/client/class.lua',
  'src/client/modules/*.lua',
  'src/client/init.lua',
}

ui_page 'web/build/index.html'

files {
  'locales/*.*',
  -- Required at runtime rather than loaded as scripts, so they only exist for
  -- the VM if they are listed here.
  'overrides/*.lua',
  'web/build/index.html',
  'web/build/**/*',
}

dependencies {
  'dirk_lib'
}

-- Opt in to Script Studio. schema.json at the resource root is the source of
-- truth for every setting, and `/dirk_stores` opens the shared panel with this
-- script selected. schema.json is deliberately NOT in files{} — it is read
-- server-side with LoadResourceFile, and listing it would make it fetchable
-- from any NUI frame.
dirk_lib 'scriptConfig'

escrow_ignore {
  'locales/*.*',
  'overrides/*.lua',
  'README.md',
  'CHANGELOG.md',
  'web/build/index.html',
  'web/build/**/*',
}
