<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Notification;

class NotificationsController extends Controller
{
    // Return notifications for the authenticated user (seller)
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401)->header('Access-Control-Allow-Origin', '*');
        }

    $notes = Notification::with(['buyer'])->where('seller_id', $user->id)->orderBy('created_at', 'desc')->get();
    
    // Ensure buyer_name is populated for each notification
    $notes->each(function ($note) {
        if (!$note->buyer_name && $note->buyer) {
            $note->buyer_name = $note->buyer->name;
        }
    });
    
    return response()->json(['notifications' => $notes])->header('Access-Control-Allow-Origin', '*');
    }

    // Mark a notification as read
    public function markRead(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401)->header('Access-Control-Allow-Origin', '*');
        }

        $note = Notification::where('id', $id)->where('seller_id', $user->id)->first();
        if (!$note) {
            return response()->json(['error' => 'Not found'], 404)->header('Access-Control-Allow-Origin', '*');
        }

        $note->is_read = true;
        $note->save();
    return response()->json(['message' => 'Marked read'])->header('Access-Control-Allow-Origin', '*');
    }

    // Delete a single notification
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401)->header('Access-Control-Allow-Origin', '*');
        }

        $deleted = Notification::where('id', $id)->where('seller_id', $user->id)->delete();
        if ($deleted === 0) {
            return response()->json(['error' => 'Not found'], 404)->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json(['message' => 'Deleted'])->header('Access-Control-Allow-Origin', '*');
    }

    // Clear all notifications for the authenticated seller
    public function clear(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401)->header('Access-Control-Allow-Origin', '*');
        }

        Notification::where('seller_id', $user->id)->delete();
        return response()->json(['message' => 'Cleared']).
            header('Access-Control-Allow-Origin', '*');
    }
}
