<?php

namespace AppHttpControllers;

use AppModelsGallery;
use AppModelsDownloadLog;
use IlluminateHttpRequest;
use IlluminateSupportFacadesDB;

class StatsController extends Controller
{
    public function index()
    {
        $user = auth('api')->user();

        if (!$user->is_admin) {
            // Fotografen sehen nur Statistiken zu ihren EIGENEN Galerien
            $galleryIds = $user->galleries()->pluck('galleries.id');
            
            $galleriesCount = count($galleryIds);
            $totalDownloads = DownloadLog::whereIn('gallery_id', $galleryIds)->count();
            $guestDownloads = DownloadLog::whereIn('gallery_id', $galleryIds)->whereNull('user_id')->count();
            
            $domainStats = DB::table('download_logs')
                ->join('users', 'download_logs.user_id', '=', 'users.id')
                ->whereIn('download_logs.gallery_id', $galleryIds)
                ->selectRaw('SUBSTRING_INDEX(users.email, "@", -1) as domain, COUNT(*) as count')
                ->groupBy('domain')
                ->orderByDesc('count')
                ->limit(10)
                ->get();
        } else {
            // Admins sehen alles
            $galleriesCount = Gallery::count();
            $totalDownloads = DownloadLog::count();
            $guestDownloads = DownloadLog::whereNull('user_id')->count();
            
            $domainStats = DB::table('download_logs')
                ->join('users', 'download_logs.user_id', '=', 'users.id')
                ->selectRaw('SUBSTRING_INDEX(users.email, "@", -1) as domain, COUNT(*) as count')
                ->groupBy('domain')
                ->orderByDesc('count')
                ->limit(10)
                ->get();
        }

        return response()->json([
            'galleries_count' => $galleriesCount,
            'total_downloads' => $totalDownloads,
            'domain_stats' => $domainStats,
            'guest_downloads' => $guestDownloads
        ]);
    }

    public function logs(Request $request)
    {
        $user = auth('api')->user();
        $query = DownloadLog::orderBy('id', 'desc');

        if (!$user->is_admin) {
            $galleryIds = $user->galleries()->pluck('galleries.id');
            $query->whereIn('gallery_id', $galleryIds);
        }

        return response()->json($query->paginate(50));
    }
}
