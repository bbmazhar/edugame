import type { GameResult } from '@/types/game';

const SESSIONS_KEY = 'edugame_sessions';

export type LocalSession = {
    slug: string;
    level: string;
    score: number;
    accuracy: number;
    rounds: number;
    durationMs: number;
    playedAt: number;
};

export type GameStat = {
    slug: string;
    best: number;
    total: number;
};

function read(): LocalSession[] {
    try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        const parsed = raw ? (JSON.parse(raw) as unknown) : [];

        return Array.isArray(parsed) ? (parsed as LocalSession[]) : [];
    } catch {
        return [];
    }
}

function write(sessions: LocalSession[]): void {
    try {
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions.slice(-500)));
    } catch {
        // storage full / unavailable — ignore
    }
}

export function recordSession(slug: string, level: string, result: GameResult): void {
    const sessions = read();
    sessions.push({
        slug,
        level,
        score: result.score,
        accuracy: Number(result.accuracy.toFixed(2)),
        rounds: result.rounds,
        durationMs: result.durationMs,
        playedAt: Date.now(),
    });
    write(sessions);
}

export function recentSessions(limit = 15): LocalSession[] {
    return read().slice(-limit).reverse();
}

export function summary(): { totalSessions: number; bestScore: number; gamesPlayed: number } {
    const sessions = read();
    const slugs = new Set(sessions.map((s) => s.slug));

    return {
        totalSessions: sessions.length,
        bestScore: sessions.reduce((m, s) => Math.max(m, s.score), 0),
        gamesPlayed: slugs.size,
    };
}

export function bestPerGame(): Record<string, GameStat> {
    const out: Record<string, GameStat> = {};

    for (const s of read()) {
        const cur = out[s.slug] ?? { slug: s.slug, best: 0, total: 0 };
        cur.best = Math.max(cur.best, s.score);
        cur.total += 1;
        out[s.slug] = cur;
    }

    return out;
}
