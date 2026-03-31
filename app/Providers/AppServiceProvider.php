<?php

namespace App\Providers;

use App\Models\Event;
use App\Policies\EventPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event as EventFacade;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Redirect to /welcome after successful registration instead of /dashboard
        $this->app->singleton(
            \Laravel\Fortify\Contracts\RegisterResponse::class,
            fn () => new class implements \Laravel\Fortify\Contracts\RegisterResponse
            {
                public function toResponse($request): mixed
                {
                    return $request->wantsJson()
                        ? response()->json(['two_factor' => false])
                        : redirect('/welcome');
                }
            }
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        Gate::policy(Event::class, EventPolicy::class);

        EventFacade::listen(Login::class, function (Login $event): void {
            $event->user->updateQuietly(['last_login_at' => now()]);
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
}
