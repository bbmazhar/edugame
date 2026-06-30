import { useEffect, useState } from 'react';
import { resolveGame } from '@/games/registry';
import type { GameEntry } from '@/types/game';
import { GAMES, LEVELS   } from './catalog';
import type {CatalogGame, LevelCode} from './catalog';
import OfflineGameShell from './offline-game-shell';
import { bestPerGame, recentSessions, summary } from './storage';

type Screen = 'catalog' | 'play' | 'profile';

const A11Y_KEY = 'edugame_a11y';
type A11y = { reduced_motion: boolean; high_contrast: boolean; font: 'default' | 'dyslexic' };
const A11Y_DEFAULT: A11y = { reduced_motion: false, high_contrast: false, font: 'default' };

function loadA11y(): A11y {
    try {
        const raw = localStorage.getItem(A11Y_KEY);

        return raw ? { ...A11Y_DEFAULT, ...JSON.parse(raw) } : A11Y_DEFAULT;
    } catch {
        return A11Y_DEFAULT;
    }
}

function applyA11y(a: A11y): void {
    const el = document.documentElement;
    el.classList.toggle('reduce-motion', a.reduced_motion);
    el.classList.toggle('high-contrast', a.high_contrast);
    el.classList.toggle('theme-calm', true);
    el.classList.toggle('font-dyslexic', a.font === 'dyslexic');
}

export default function App() {
    const [screen, setScreen] = useState<Screen>('catalog');
    const [level, setLevel] = useState<LevelCode>('SD');
    const [active, setActive] = useState<CatalogGame | null>(null);
    const [a11y, setA11y] = useState<A11y>(() => loadA11y());

    useEffect(() => {
        applyA11y(a11y);

        try {
            localStorage.setItem(A11Y_KEY, JSON.stringify(a11y));
        } catch {
            /* ignore */
        }
    }, [a11y]);

    const openGame = (game: CatalogGame) => {
        setActive(game);
        setScreen('play');
    };

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="border-b border-border">
                <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
                    <button type="button" onClick={() => setScreen('catalog')} className="text-lg font-semibold">
                        EduGame
                    </button>
                    <nav className="flex items-center gap-1 text-sm">
                        <button type="button" onClick={() => setScreen('catalog')} className="min-h-11 rounded-md px-3 hover:bg-accent">
                            Katalog
                        </button>
                        <button type="button" onClick={() => setScreen('profile')} className="min-h-11 rounded-md px-3 hover:bg-accent">
                            Profil
                        </button>
                        <details className="relative">
                            <summary className="min-h-11 cursor-pointer list-none rounded-md border border-border px-3 py-1.5 [&::-webkit-details-marker]:hidden">
                                A11y
                            </summary>
                            <div className="absolute right-0 z-50 mt-2 w-60 rounded-lg border border-border bg-card p-2 text-sm shadow-lg">
                                <Toggle label="Kurangi animasi" on={a11y.reduced_motion} set={(v) => setA11y({ ...a11y, reduced_motion: v })} />
                                <Toggle label="Kontras tinggi" on={a11y.high_contrast} set={(v) => setA11y({ ...a11y, high_contrast: v })} />
                                <Toggle
                                    label="Huruf disleksia"
                                    on={a11y.font === 'dyslexic'}
                                    set={(v) => setA11y({ ...a11y, font: v ? 'dyslexic' : 'default' })}
                                />
                            </div>
                        </details>
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
                {screen === 'catalog' && <Catalog level={level} setLevel={setLevel} onPlay={openGame} />}
                {screen === 'play' && active && <Play game={active} level={level} onExit={() => setScreen('catalog')} />}
                {screen === 'profile' && <Profile />}
            </main>
        </div>
    );
}

function Catalog({ level, setLevel, onPlay }: { level: LevelCode; setLevel: (l: LevelCode) => void; onPlay: (g: CatalogGame) => void }) {
    return (
        <section className="flex flex-col gap-5">
            <div>
                <h1 className="text-2xl font-semibold">Pilih game</h1>
                <p className="text-muted-foreground">Latihan kognitif yang seru &amp; ramah fokus — semua offline.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Pilih jenjang">
                {LEVELS.map((l) => (
                    <button
                        key={l.code}
                        type="button"
                        aria-selected={l.code === level}
                        onClick={() => setLevel(l.code)}
                        className={
                            'min-h-11 rounded-full border px-5 py-2 text-sm font-medium ' +
                            (l.code === level ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-accent')
                        }
                    >
                        {l.code}
                    </button>
                ))}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {GAMES.map((g) => (
                    <button
                        key={g.slug}
                        type="button"
                        onClick={() => onPlay(g)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left hover:bg-accent"
                    >
                        <h3 className="font-semibold">{g.name}</h3>
                        <span className="text-xs text-muted-foreground">{g.domain}</span>
                        <p className="text-sm text-muted-foreground">{g.description}</p>
                        <span className="mt-1 inline-flex min-h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
                            Main ({level})
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function Play({ game, level, onExit }: { game: CatalogGame; level: LevelCode; onExit: () => void }) {
    const [entry, setEntry] = useState<GameEntry | null>(null);

    useEffect(() => {
        let active = true;
        setEntry(null);
        resolveGame(game.slug).then((e) => active && setEntry(e));

        return () => {
            active = false;
        };
    }, [game.slug]);

    if (!entry) {
        return <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">Memuat game…</div>;
    }

    return (
        <OfflineGameShell
            game={{ slug: game.slug, name: game.name, domain: game.domain }}
            level={{ code: level, name: LEVELS.find((l) => l.code === level)?.name ?? level }}
            params={game.params[level]}
            entry={entry}
            onExit={onExit}
        />
    );
}

function Profile() {
    const s = summary();
    const per = bestPerGame();
    const recent = recentSessions();
    const nameOf = (slug: string) => GAMES.find((g) => g.slug === slug)?.name ?? slug;

    return (
        <section className="flex flex-col gap-6">
            <h1 className="text-2xl font-semibold">Profil</h1>
            {s.totalSessions === 0 ? (
                <p className="rounded-lg border border-border bg-card p-6 text-muted-foreground">Belum ada permainan. Yuk main!</p>
            ) : (
                <>
                    <div className="grid grid-cols-3 gap-3">
                        <Card label="Total main" value={s.totalSessions} />
                        <Card label="Skor terbaik" value={s.bestScore} />
                        <Card label="Game dimainkan" value={s.gamesPlayed} />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {Object.values(per).map((g) => (
                            <div key={g.slug} className="rounded-xl border border-border bg-card p-4">
                                <h3 className="font-semibold">{nameOf(g.slug)}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Terbaik {g.best} · Main {g.total}×
                                </p>
                            </div>
                        ))}
                    </div>
                    <div>
                        <h2 className="mb-2 text-lg font-semibold">Riwayat terbaru</h2>
                        <ul className="divide-y divide-border rounded-xl border border-border">
                            {recent.map((r, i) => (
                                <li key={i} className="flex items-center justify-between px-4 py-2 text-sm">
                                    <span>
                                        {nameOf(r.slug)} · {r.level}
                                    </span>
                                    <span className="tabular-nums text-muted-foreground">
                                        {r.score} · {r.accuracy.toFixed(0)}%
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </section>
    );
}

function Toggle({ label, on, set }: { label: string; on: boolean; set: (v: boolean) => void }) {
    return (
        <button type="button" onClick={() => set(!on)} className="flex min-h-11 w-full items-center justify-between rounded-md px-3 hover:bg-accent">
            <span>{label}</span>
            <span className={'relative h-6 w-11 rounded-full ' + (on ? 'bg-primary' : 'bg-muted')}>
                <span className={'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ' + (on ? 'translate-x-5' : '')} />
            </span>
        </button>
    );
}

function Card({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </div>
    );
}
