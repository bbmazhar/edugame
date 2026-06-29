const KEY = 'guest_sessions';

/** Remembers a guest's game session id so it can be claimed after sign-up. */
export function addGuestSession(id: number): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        const current = getGuestSessions();

        if (!current.includes(id)) {
            localStorage.setItem(
                KEY,
                JSON.stringify([...current, id].slice(-100)),
            );
        }
    } catch {
        // localStorage unavailable — guest progress simply isn't tracked.
    }
}

export function getGuestSessions(): number[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = localStorage.getItem(KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];

        return Array.isArray(parsed)
            ? parsed.filter((n): n is number => typeof n === 'number')
            : [];
    } catch {
        return [];
    }
}

export function clearGuestSessions(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.removeItem(KEY);
    } catch {
        // ignore
    }
}
