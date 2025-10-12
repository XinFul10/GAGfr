<?php

namespace App\Http\Controllers;

use App\Models\MarketProduct;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MarketController extends Controller
{
    public function getProducts()
    {
        $products = MarketProduct::with(['seller', 'buyer'])
            ->where('is_sold', false)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'products' => $products
        ])->header('Access-Control-Allow-Origin', '*');
    }

    public function addProduct(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:1',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            'seller_id' => 'required|string|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400)->header('Access-Control-Allow-Origin', '*');
        }

        try {
            $productData = $request->only(['name', 'description', 'price', 'stock', 'seller_id']);
            
            // Handle image upload
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('product_images', $imageName, 'public');
                $productData['image'] = 'product_images/' . $imageName;
                
                // Log for debugging
                \Log::info('Image uploaded:', [
                    'original_name' => $image->getClientOriginalName(),
                    'stored_path' => $imagePath,
                    'public_path' => $productData['image'],
                    'file_exists' => file_exists(storage_path('app/public/product_images/' . $imageName))
                ]);
            } else {
                \Log::info('No image file received in request');
            }

            $product = MarketProduct::create($productData);
            $product->load(['seller', 'buyer']);

            return response()->json([
                'message' => 'Product added successfully',
                'product' => $product
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            \Log::error('Error adding product:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'error' => 'Failed to add product: ' . $e->getMessage()
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }

    public function purchaseProduct(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'buyer_id' => 'required|string|exists:users,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'details' => $validator->errors()
            ], 400)->header('Access-Control-Allow-Origin', '*');
        }

        try {
            $product = MarketProduct::findOrFail($id);

            if ($product->is_sold) {
                return response()->json([
                    'error' => 'Product is already sold'
                ], 400)->header('Access-Control-Allow-Origin', '*');
            }

            if ($product->stock <= 0) {
                return response()->json([
                    'error' => 'Product is out of stock'
                ], 400)->header('Access-Control-Allow-Origin', '*');
            }

            if ($product->seller_id === $request->buyer_id) {
                return response()->json([
                    'error' => 'Cannot purchase your own product'
                ], 400)->header('Access-Control-Allow-Origin', '*');
            }

            // Reduce stock by 1
            $product->stock -= 1;
            $product->buyer_id = $request->buyer_id;
            
            // Mark as sold if stock reaches 0
            if ($product->stock <= 0) {
                $product->is_sold = true;
            }

            $product->save();
            $product->load(['seller', 'buyer']);

            // Create a server-side notification for the seller and include it in the response
            $createdNotification = null;
            try {
                \Log::info('Creating notification for purchase', [
                    'seller_id' => $product->seller_id,
                    'buyer_id' => $product->buyer_id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'buyer_name' => $product->buyer->name ?? 'Unknown Buyer'
                ]);
                
                $createdNotification = Notification::create([
                    'seller_id' => $product->seller_id,
                    'buyer_id' => $product->buyer_id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_price' => $product->price,
                    'product_image' => $product->image,
                    'buyer_name' => $product->buyer->name ?? 'Unknown Buyer',
                    'is_read' => false,
                ]);
                
                \Log::info('Notification created successfully', ['notification_id' => $createdNotification->id]);
            } catch (\Exception $e) {
                \Log::error('Failed to create notification: ' . $e->getMessage(), [
                    'trace' => $e->getTraceAsString()
                ]);
            }

            return response()->json([
                'message' => 'Product purchased successfully',
                'product' => $product,
                'notification' => $createdNotification
            ])->header('Access-Control-Allow-Origin', '*');
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to purchase product'
            ], 500)->header('Access-Control-Allow-Origin', '*');
        }
    }
}
