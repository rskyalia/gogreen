<?php

namespace App\Exceptions;

use Exception;

/**
 * Exception domain untuk error API yang sudah memiliki kode mesin.
 *
 * Dirender oleh bootstrap/app.php menjadi:
 *   { "message": "...", "code": "kode_mesin", "errors": {...} }
 */
class ApiException extends Exception
{
    /**
     * @param  array<string, list<string>>  $errors
     */
    public function __construct(
        public readonly string $errorCode,
        string $message,
        public readonly int $status = 422,
        public readonly array $errors = [],
    ) {
        parent::__construct($message);
    }

    /**
     * @param  array<string, list<string>>  $errors
     */
    public static function make(string $errorCode, string $message, int $status = 422, array $errors = []): self
    {
        return new self($errorCode, $message, $status, $errors);
    }
}
