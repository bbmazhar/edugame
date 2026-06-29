<?php

return [
    /*
    | Mobile (Android) shell release metadata served at GET /api/app/version.
    | For Option A (Capacitor wrap) the shell only needs a new APK when the
    | native shell/plugins change — content updates ship via the web deploy.
    | Set these in the environment when you publish a new shell APK.
    */
    'version_code' => (int) env('MOBILE_VERSION_CODE', 1),
    'version_name' => env('MOBILE_VERSION_NAME', '1.0.0'),
    'apk_url' => env('MOBILE_APK_URL'),
    'changelog' => env('MOBILE_CHANGELOG', ''),
    'force_update' => (bool) env('MOBILE_FORCE_UPDATE', false),
];
