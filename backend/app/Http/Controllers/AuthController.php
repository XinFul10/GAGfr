<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Config;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:120',
            'email' => 'required|string|email|max:160|unique:users',
            'password' => 'required|string|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors(),
                'received_data' => $request->all()
            ], 400)->header('Access-Control-Allow-Origin', '*');
        }

        try {
            // NOTE: User model casts the password as 'hashed' (see User::$casts),
            // so we must NOT pre-hash here or Hash::check will fail later (double-hash).
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password,
                'is_active' => false, // User needs to complete registration
            ]);

            return response()->json([
                'message' => 'Account created successfully. Please complete your registration.',
                'user_id' => $user->id,
                'email' => $user->email,
                'requires_completion' => true
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            // Log full exception and return readable message in debug mode
            Log::error('Signup error: ' . $e->getMessage(), ['exception' => $e]);
            $message = Config::get('app.debug') ? $e->getMessage() : 'Server error';
            return response()->json(['error' => $message], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => 'Missing fields'], 400)->header('Access-Control-Allow-Origin', '*');
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401)->header('Access-Control-Allow-Origin', '*');
        }

        if (!$user->is_active) {
            return response()->json([
                'error' => 'Account not activated. Please complete your registration.',
                'requires_completion' => true,
                'user_id' => $user->id
            ], 403)->header('Access-Control-Allow-Origin', '*');
        }

        try {
            $token = $user->createToken('auth-token')->plainTextToken;
        } catch (\Exception $e) {
            // Token creation can fail if personal_access_tokens table is missing or DB errors occur
            Log::error('Token creation failed: ' . $e->getMessage(), ['exception' => $e, 'user_id' => $user->id]);
            $message = Config::get('app.debug') ? $e->getMessage() : 'Failed to generate token';
            return response()->json(['error' => $message], 500)->header('Access-Control-Allow-Origin', '*');
        }

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ])->header('Access-Control-Allow-Origin', '*');
    }

    public function completeRegistration(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|string|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid user ID',
                'details' => $validator->errors()
            ], 400)->header('Access-Control-Allow-Origin', '*');
        }

        try {
            $user = User::findOrFail($request->user_id);
            
            if ($user->is_active) {
                return response()->json([
                    'error' => 'Account is already activated'
                ], 400)->header('Access-Control-Allow-Origin', '*');
            }

            $user->is_active = true;
            $user->save();

            return response()->json([
                'message' => 'Registration completed successfully! Please log in with your credentials.'
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            Log::error('Complete registration error: ' . $e->getMessage(), ['exception' => $e]);
            $message = Config::get('app.debug') ? $e->getMessage() : 'Server error';
            return response()->json(['error' => $message], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function getAllUsers()
    {
        try {
            $users = User::select('id', 'name', 'email', 'is_active', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'users' => $users
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch users'], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function getUserProfile($userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404)->header('Access-Control-Allow-Origin', '*');
            }

            return response()->json([
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'created_at' => $user->created_at,
                    'total_products' => $user->products()->count(),
                    'total_sales' => $user->products()->where('is_sold', true)->count(),
                    'rating' => 4.5, // Default rating, can be calculated from reviews
                    'bio' => $user->bio ?? 'No bio available',
                    'location' => $user->location ?? 'Location not specified',
                    'avatar_url' => $user->avatar_url
                ]
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to fetch user profile'], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
            ]
        ]);
    }

    public function updateProfile(Request $request, $userId)
    {
        try {
            $user = User::find($userId);
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404)->header('Access-Control-Allow-Origin', '*');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:120',
                'location' => 'sometimes|string|max:255',
                'bio' => 'sometimes|string|max:1000',
                'avatar' => 'sometimes|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'error' => 'Validation failed',
                    'details' => $validator->errors()
                ], 400)->header('Access-Control-Allow-Origin', '*');
            }

            // Update basic fields
            if ($request->has('name')) {
                $user->name = $request->name;
            }
            if ($request->has('location')) {
                $user->location = $request->location;
            }
            if ($request->has('bio')) {
                $user->bio = $request->bio;
            }

            // Handle avatar upload
            if ($request->hasFile('avatar')) {
                $avatar = $request->file('avatar');
                
                // Create uploads directory if it doesn't exist
                $uploadPath = public_path('uploads/avatars');
                if (!file_exists($uploadPath)) {
                    mkdir($uploadPath, 0755, true);
                }

                // Generate unique filename
                $filename = $userId . '_' . time() . '.' . $avatar->getClientOriginalExtension();
                
                // Move file to public directory
                $avatar->move($uploadPath, $filename);
                
                // Delete old avatar if exists
                if ($user->avatar_url) {
                    $oldAvatarPath = public_path('uploads/avatars/' . basename($user->avatar_url));
                    if (file_exists($oldAvatarPath)) {
                        unlink($oldAvatarPath);
                    }
                }
                
                // Store relative URL
                $user->avatar_url = url('uploads/avatars/' . $filename);
            }

            $user->save();

            return response()->json([
                'message' => 'Profile updated successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'bio' => $user->bio,
                    'location' => $user->location,
                    'avatar_url' => $user->avatar_url,
                    'created_at' => $user->created_at,
                    'total_products' => $user->products()->count(),
                    'total_sales' => $user->products()->where('is_sold', true)->count(),
                    'rating' => 4.5,
                ]
            ])->header('Access-Control-Allow-Origin', '*');

        } catch (\Exception $e) {
            Log::error('Update profile error: ' . $e->getMessage(), ['exception' => $e]);
            $message = Config::get('app.debug') ? $e->getMessage() : 'Failed to update profile';
            return response()->json(['error' => $message], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }
}
