<?php

namespace App\Http\Controllers;

use App\Models\Gallery;
use App\Models\DownloadLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    private function processDomainStats($rawDomainStats)
    {
        $mapped = [];
        foreach ($rawDomainStats as $stat) {
            $domain = $stat->domain === 'invite.local' ? 'Benannte Invite Links' : $stat->domain;
            if (!isset($mapped[$domain])) {
                $mapped[$domain] = ['domain' => $domain, 'count' => 0];
            }
            $mapped[$domain]['count'] += $stat->count;
        }
        $domainStats = array_values($mapped);
        usort($domainStats, function($a, $b) { return $b['count'] <=> $a['count']; });
        return array_slice($domainStats, 0, 10);
    }

    public function index()
    {
        $user = auth('api')->user();

        if (!$user->is_admin) {
            // Fotografen sehen nur Statistiken zu ihren EIGENEN Galerien
            $galleryIds = $user->galleries()->pluck('galleries.id');
            
            $galleriesCount = count($galleryIds);
            $totalDownloads = DownloadLog::whereIn('gallery_id', $galleryIds)->count();
            $guestDownloads = DownloadLog::whereIn('gallery_id', $galleryIds)->whereNull('user_id')->count();
            
            $rawDomainStats = DB::table('download_logs')
                ->join('users', 'download_logs.user_id', '=', 'users.id')
                ->whereIn('download_logs.gallery_id', $galleryIds)
                ->selectRaw('SUBSTRING_INDEX(users.email, "@", -1) as domain, COUNT(*) as count')
                ->groupBy('domain')
                ->get();
                
            $domainStats = $this->processDomainStats($rawDomainStats);
        } else {
            // Admins sehen alles
            $galleriesCount = Gallery::count();
            $totalDownloads = DownloadLog::count();
            $guestDownloads = DownloadLog::whereNull('user_id')->count();
            
            $rawDomainStats = DB::table('download_logs')
                ->join('users', 'download_logs.user_id', '=', 'users.id')
                ->selectRaw('SUBSTRING_INDEX(users.email, "@", -1) as domain, COUNT(*) as count')
                ->groupBy('domain')
                ->get();
                
            $domainStats = $this->processDomainStats($rawDomainStats);
        }

        
            $topGalleries = DB::table('download_logs')
                ->select('gallery_name_snapshot as name', DB::raw('COUNT(*) as count'))
                ->when(!$user->is_admin, fn($q) => $q->whereIn('gallery_id', $galleryIds))
                ->whereNotNull('gallery_name_snapshot')
                ->groupBy('gallery_name_snapshot')
                ->orderByDesc('count')->limit(5)->get();

            $topPhotos = DB::table('download_logs')
                ->select('item_identifier as name', DB::raw('COUNT(*) as count'))
                ->where('item_type', 'single_image')
                ->when(!$user->is_admin, fn($q) => $q->whereIn('gallery_id', $galleryIds))
                ->groupBy('item_identifier')
                ->orderByDesc('count')->limit(5)->get();
                
        return response()->json([
            'galleries_count' => $galleriesCount,
            'total_downloads' => $totalDownloads,
            'domain_stats' => $domainStats,
            'guest_downloads' => $guestDownloads,
            'top_galleries' => $topGalleries,
            'top_photos' => $topPhotos
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
