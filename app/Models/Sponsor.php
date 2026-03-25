<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Sponsor extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * Get all events by this sponsor.
     */
    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }

    public function registerMediaCollections(): void
    {
        $mimes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

        $this->addMediaCollection('logo_square')->singleFile()->acceptsMimeTypes($mimes);
        $this->addMediaCollection('logo_square_dark')->singleFile()->acceptsMimeTypes($mimes);
        $this->addMediaCollection('logo_rect')->singleFile()->acceptsMimeTypes($mimes);
        $this->addMediaCollection('logo_rect_dark')->singleFile()->acceptsMimeTypes($mimes);
    }

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('display')
            ->width(400)
            ->nonQueued();
    }
}
