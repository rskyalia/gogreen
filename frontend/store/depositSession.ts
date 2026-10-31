/**
 * store/depositSession.ts
 *
 * Sesi setoran ephemeral — disimpan di memori (bukan localStorage) agar
 * bersih setiap kali user menutup tab.
 *
 * Alur:
 *   1. /waste-bank/members/scan → set({ member, token | code, claimedUntil })
 *   2. /waste-bank/deposits/new → baca session, tampilkan kartu member
 *   3. Setelah setoran berhasil / user klik "Pindai ulang" → clear()
 *
 * Bila deposit/new dibuka dan session kosong atau klaim sudah lewat,
 * komponen harus redirect ke /waste-bank/members/scan.
 */

export interface DepositMember {
    id: number;
    name: string;
    member_code: string;
    avatar: string | null;
}

export interface DepositSession {
    member: DepositMember;
    /** Token QR yang diklaim (ada bila mode QR). */
    token?: string;
    /** Kode member manual (ada bila mode kode). */
    code?: string;
    /** Timestamp (ms) saat klaim dibuat. Claimed TTL = 15 menit. */
    claimedAt: number;
    /** ISO string dari claim_expires_at yang dikembalikan backend. */
    claimedUntil?: string;
}

// ── Module-level state ────────────────────────────────────────────────────

type Listener = () => void;

let _session: DepositSession | null = null;
const _listeners = new Set<Listener>();

function notify() {
    _listeners.forEach((fn) => fn());
}

// ── Public API ─────────────────────────────────────────────────────────────

export const depositSession = {
    /** Baca session saat ini. */
    get(): DepositSession | null {
        return _session;
    },

    /** Simpan session baru. */
    set(session: DepositSession): void {
        _session = session;
        notify();
    },

    /** Hapus session. */
    clear(): void {
        _session = null;
        notify();
    },

    /** Apakah klaim masih berlaku (TTL 15 menit). */
    isValid(): boolean {
        if (!_session) return false;
        const CLAIM_TTL_MS = 15 * 60 * 1000;
        return Date.now() - _session.claimedAt < CLAIM_TTL_MS;
    },

    /** Subscribe ke perubahan state. Kembalikan fungsi unsubscribe. */
    subscribe(listener: Listener): () => void {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
    },
};
