<?php

namespace AppHttpControllers;

use IlluminateHttpRequest;
use AppModelsSetting;

class SettingsController extends Controller
{
    public function getWatermark()
    {
        $hasSvg = file_exists(storage_path('app/private/watermark.svg'));
        return response()->json([
            'has_svg' => $hasSvg,
            'scale' => Setting::where('key', 'watermark_scale')->value('value') ?? 0.10,
            'opacity' => Setting::where('key', 'watermark_opacity')->value('value') ?? 0.6,
            'position' => Setting::where('key', 'watermark_position')->value('value') ?? 'bottom-right',
        ]);
    }

    public function updateWatermark(Request $request)
    {
        if ($request->hasFile('svg')) {
            $request->validate(['svg' => 'file|mimes:svg']);
            $request->file('svg')->move(storage_path('app/private'), 'watermark.svg');
            
            // Alte gecachte Master-PNGs aufräumen
            $oldCaches = glob(storage_path('app/private/watermark_master_*.png'));
            if ($oldCaches) array_map('unlink', $oldCaches);
        }

        if ($request->has('scale')) Setting::updateOrCreate(['key' => 'watermark_scale'], ['value' => $request->scale]);
        if ($request->has('opacity')) Setting::updateOrCreate(['key' => 'watermark_opacity'], ['value' => $request->opacity]);
        if ($request->has('position')) Setting::updateOrCreate(['key' => 'watermark_position'], ['value' => $request->position]);

        return response()->json(['success' => true]);
    }
}
