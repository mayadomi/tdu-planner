<?php

namespace App\Policies;

use App\Models\Event;
use App\Models\User;

class EventPolicy
{
    /**
     * Admins bypass all policy checks.
     */
    public function before(User $user): ?bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * Any approved editor or admin can create events.
     */
    public function create(User $user): bool
    {
        return $user->isEditor();
    }

    /**
     * Editors may only edit events they created.
     * Admins bypass this via before().
     */
    public function update(User $user, Event $event): bool
    {
        return $user->isEditor() && $event->created_by_user_id === $user->id;
    }

    /**
     * Same ownership rule for banner image management.
     */
    public function manageBanner(User $user, Event $event): bool
    {
        return $user->isEditor() && $event->created_by_user_id === $user->id;
    }

    /**
     * Editors may only delete events they created.
     */
    public function delete(User $user, Event $event): bool
    {
        return $user->isEditor() && $event->created_by_user_id === $user->id;
    }
}
