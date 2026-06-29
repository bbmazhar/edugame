<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AppVersionController extends Controller
{
    /**
     * Public endpoint for the Android shell self-update check.
     * The client compares latest_version_code (integer) against its own.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'latest_version_code' => (int) config('mobile.version_code'),
            'latest_version_name' => config('mobile.version_name'),
            'apk_url' => config('mobile.apk_url'),
            'changelog' => config('mobile.changelog'),
            'force_update' => (bool) config('mobile.force_update'),
        ]);
    }
}
