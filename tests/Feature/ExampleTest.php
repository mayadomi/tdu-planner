<?php

it('renders the homepage for guests', function () {
    $this->get('/')->assertOk()->assertInertia(fn ($page) => $page->component('home'));
});
