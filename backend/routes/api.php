<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MarketController;
use App\Http\Controllers\NotificationsController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/health', function () {
    return response()->json(['ok' => true])->header('Access-Control-Allow-Origin', '*');
});

Route::post('/auth/signup', [AuthController::class, 'signup']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/complete-registration', [AuthController::class, 'completeRegistration']);
Route::get('/auth/users', [AuthController::class, 'getAllUsers']);
Route::get('/users/{userId}', [AuthController::class, 'getUserProfile']);

// Test route to create a notification (for debugging)
Route::post('/test/notification', function(Request $request) {
    $notification = \App\Models\Notification::create([
        'seller_id' => $request->seller_id ?? 'test-seller-id',
        'buyer_id' => $request->buyer_id ?? 'test-buyer-id', 
        'product_id' => $request->product_id ?? 'test-product-id',
        'product_name' => $request->product_name ?? 'Test Tomatoes',
        'product_price' => $request->product_price ?? 150.00,
        'product_image' => $request->product_image ?? 'test-image.jpg',
        'buyer_name' => $request->buyer_name ?? 'John Test Buyer',
        'is_read' => false,
    ]);
    return response()->json(['notification' => $notification])->header('Access-Control-Allow-Origin', '*');
});

// Market routes
Route::get('/market/products', [MarketController::class, 'getProducts']);
Route::post('/market/products', [MarketController::class, 'addProduct']);
Route::post('/market/products/{id}/purchase', [MarketController::class, 'purchaseProduct']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/notifications', [NotificationsController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationsController::class, 'markRead']);
    Route::delete('/notifications/{id}', [NotificationsController::class, 'destroy']);
    Route::delete('/notifications', [NotificationsController::class, 'clear']);
});


