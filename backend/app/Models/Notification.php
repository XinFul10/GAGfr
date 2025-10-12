<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Notification extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'id', 'seller_id', 'buyer_id', 'product_id', 'product_name', 'product_price', 'product_image', 'buyer_name', 'is_read'
    ];

    protected $appends = ['product_image_url'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Accessor to expose a public URL for the stored product image.
     */
    public function getProductImageUrlAttribute(): ?string
    {
        if (empty($this->product_image)) {
            return null;
        }
        // Ensure we expose a public URL pointing to the storage link (public/storage/...)
        $path = 'storage/' . ltrim($this->product_image, '/');
        return asset($path);
    }
}
