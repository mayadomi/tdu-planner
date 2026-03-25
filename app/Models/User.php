<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'role',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Get the user's favourites.
     */
    public function favourites(): HasMany
    {
        return $this->hasMany(Favourite::class);
    }

    /**
     * Get the events the user has favourited.
     */
    public function favouriteEvents(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'favourites')
            ->withTimestamps();
    }

    /**
     * Check if the user has favourited a specific event.
     */
    public function hasFavourited(Event $event): bool
    {
        return $this->favourites()->where('event_id', $event->id)->exists();
    }

    /**
     * Check if the user has the editor role (approved editors only).
     */
    public function isEditor(): bool
    {
        return $this->role === 'editor';
    }

    /**
     * Check if the user has the admin role.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if the user has a pending editor request.
     */
    public function isEditorPending(): bool
    {
        return $this->role === 'editor_pending';
    }

    /**
     * Check if the user can create/edit events (editor or admin).
     */
    public function canEditEvents(): bool
    {
        return $this->isEditor() || $this->isAdmin();
    }

    /**
     * Toggle favourite status for an event.
     */
    public function toggleFavourite(Event $event): bool
    {
        if ($this->hasFavourited($event)) {
            $this->favouriteEvents()->detach($event->id);
            return false;
        }

        $this->favouriteEvents()->attach($event->id);
        return true;
    }
}
