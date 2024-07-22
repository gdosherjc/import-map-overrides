IMPORTMAP='      {"imports":{"@jumpcloud-ap/monolith_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/monolith_app/20240715.11.1006-114b97/app.js","@jumpcloud-ap/monolith_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/monolith_app/20240715.7.208-72a4f7/app.js","@jumpcloud-ap/peripheralui_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/peripheralui_app/20240702.19.937-a66bf3/app.js","@jumpcloud-ap/peripheralui_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/peripheralui_app/20240628.16.5712-0fdf10/app.js","@jumpcloud-ap/sidenav_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/sidenav_app/20240702.19.937-a66bf3/app.js","@jumpcloud-ap/sidenav_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/sidenav_app/20240701.14.4801-23c456/app.js","@jumpcloud-ap/topnav_app":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/topnav_app/20240712.13.1705-de4bec/app.js","@jumpcloud-ap/topnav_app_fallback":"https://cdn03.jumpcloud.com/admin/@jumpcloud-ap/topnav_app/20240710.17.1351-302307/app.js"}}'

pnpm run build:dev

cd /Users/gdosher/go/src/github.com/TheJumpCloud/jumpcloud-admin-portal/apps/orchestrator

pnpm run build

sed -i '' "s|.*IMPORT_MAP_CONTENTS.*|$IMPORTMAP|" "dist/index.html"

cd /Users/gdosher/go/src/gdosherjc/import-map-overrides