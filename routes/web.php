<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\EventSearchController;
use App\Http\Controllers\Api\FavouriteController;
use App\Http\Controllers\Api\LocationController;
use App\Http\Controllers\Api\SponsorController;
use App\Http\Controllers\Api\TagController;
use App\Http\Controllers\EventPageController;
use App\Http\Controllers\ProfileEditorRequestController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\SponsorPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return auth()->check()
        ? redirect()->route('dashboard')
        : redirect()->route('events.index');
})->name('home');

// Public event pages — /events/create must be declared before /{event} wildcard
Route::get('/events', [EventPageController::class, 'index'])->name('events.index');
Route::get('/events/{event}', [EventPageController::class, 'show'])->name('events.show')->whereNumber('event');

// Schedule/Timeline View
Route::get('/schedule', [ScheduleController::class, 'index'])->name('schedule.index');

// Public API routes
Route::prefix('api')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{category:slug}', [CategoryController::class, 'show']);
    Route::get('/categories/{category:slug}/events', [CategoryController::class, 'events']);

    Route::get('/sponsors', [SponsorController::class, 'index']);
    Route::get('/sponsors/{sponsor:slug}', [SponsorController::class, 'show']);
    Route::get('/sponsors/{sponsor:slug}/events', [SponsorController::class, 'events']);

    Route::get('/locations', [LocationController::class, 'index']);
    Route::get('/locations/{location}', [LocationController::class, 'show']);

    Route::get('/tags', [TagController::class, 'index']);

    Route::get('/events/search', EventSearchController::class);
});

// Authenticated routes (viewer and above)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', fn () => Inertia::render('dashboard'))->name('dashboard');

    // Favourites API
    Route::prefix('api')->group(function () {
        Route::get('/favourites', [FavouriteController::class, 'index']);
        Route::post('/favourites/{event}', [FavouriteController::class, 'store']);
        Route::delete('/favourites/{event}', [FavouriteController::class, 'destroy']);
        Route::post('/favourites/{event}/toggle', [FavouriteController::class, 'toggle']);
    });

    // Request / cancel editor access
    Route::post('/profile/request-editor', [ProfileEditorRequestController::class, 'store'])
        ->name('profile.request-editor');
    Route::delete('/profile/request-editor', [ProfileEditorRequestController::class, 'destroy'])
        ->name('profile.cancel-editor-request');
});

// Editor + Admin routes (create/edit events, manage sponsors)
Route::middleware(['auth', 'verified', 'editor'])->group(function () {
    // Create event
    Route::get('/events/create', [EventPageController::class, 'create'])->name('events.create');
    Route::post('/events', [EventPageController::class, 'store'])->name('events.store');

    // Edit event
    Route::get('/events/{event}/edit', [EventPageController::class, 'edit'])->name('events.edit')->whereNumber('event');
    Route::patch('/events/{event}', [EventPageController::class, 'update'])->name('events.update')->whereNumber('event');

    // Event banner image
    Route::post('/events/{event}/banner', [EventPageController::class, 'uploadBanner'])->name('events.banner.upload')->whereNumber('event');
    Route::delete('/events/{event}/banner', [EventPageController::class, 'deleteBanner'])->name('events.banner.delete')->whereNumber('event');

    // Sponsor management
    Route::get('/sponsors', [SponsorPageController::class, 'index'])->name('sponsors.index');
    Route::post('/sponsors/{sponsor:slug}/images/{collection}', [SponsorPageController::class, 'uploadImage'])->name('sponsors.image.upload');
    Route::delete('/sponsors/{sponsor:slug}/images/{collection}', [SponsorPageController::class, 'deleteImage'])->name('sponsors.image.delete');
});

// Admin-only routes
Route::middleware(['auth', 'verified', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole'])->name('users.update-role');
});

require __DIR__.'/settings.php';
