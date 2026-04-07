<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class SponsorClaim extends Pivot
{
    /** @use HasFactory<\Database\Factories\SponsorClaimFactory> */
    use HasFactory;

    public $incrementing = true;

    protected $table = 'sponsor_user';

    protected $fillable = [
        'user_id',
        'sponsor_id',
        'status',
        'request_type',
        'editor_note',
        'admin_note',
        'proposed_sponsor_name',
        'proposed_sponsor_website',
        'verified_at',
        'verified_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('status', 'verified');
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', 'rejected');
    }

    public function approve(User $admin): void
    {
        $this->update([
            'status' => 'verified',
            'verified_at' => now(),
            'verified_by_user_id' => $admin->id,
            'admin_note' => null,
        ]);
    }

    public function reject(User $admin, ?string $note = null): void
    {
        $this->update([
            'status' => 'rejected',
            'verified_at' => null,
            'verified_by_user_id' => $admin->id,
            'admin_note' => $note,
        ]);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function sponsor(): BelongsTo
    {
        return $this->belongsTo(Sponsor::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by_user_id');
    }
}
