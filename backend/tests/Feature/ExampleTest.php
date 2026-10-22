<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Placeholder test bawaan Laravel.
 * Menggunakan endpoint yang terdaftar di aplikasi ini (/api/up).
 */
class ExampleTest extends TestCase
{
    public function test_health_check_returns_ok(): void
    {
        $response = $this->get('/up');

        $response->assertStatus(200);
    }
}
