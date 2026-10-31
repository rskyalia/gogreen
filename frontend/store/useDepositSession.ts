'use client';

import { useSyncExternalStore } from 'react';
import { depositSession, type DepositSession } from './depositSession';

/**
 * Hook untuk membaca deposit session di Client Components.
 * Bereaksi secara reaktif terhadap perubahan dari komponen lain.
 */
export function useDepositSession(): {
    session: DepositSession | null;
    isValid: boolean;
} {
    const session = useSyncExternalStore(
        depositSession.subscribe.bind(depositSession),
        depositSession.get.bind(depositSession),
        // Server snapshot: null (halaman ini selalu client-only)
        () => null,
    );

    return {
        session,
        isValid: depositSession.isValid(),
    };
}
