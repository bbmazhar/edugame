<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Profile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AccessibilityController extends Controller
{
    /**
     * Persist a player's accessibility / preference settings to their profile.
     */
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'reduced_motion' => ['sometimes', 'boolean'],
            'sound' => ['sometimes', 'boolean'],
            'theme' => ['sometimes', 'string', 'in:default,calm'],
            'high_contrast' => ['sometimes', 'boolean'],
            'font' => ['sometimes', 'string', 'in:default,dyslexic'],
        ]);

        $profile = $request->user()->profile()->firstOrCreate([]);

        $profile->settings = array_merge(
            Profile::defaultSettings(),
            $profile->settings ?? [],
            $data,
        );
        $profile->save();

        return back();
    }
}
