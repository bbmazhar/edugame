import { cn } from '@/lib/utils';
import type { GameEntry, GameModule, GameParams, GameRoundProps } from '@/types/game';
import { useEffect, useRef, useState } from 'react';

const THEMES: Record<string, string[]> = {
    animals: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
    fruits: ['🍎', '🍌', '🍇', '🍓', '🍊', '🍉', '🍐', '🍑', '🍒', '🥝', '🍍', '🥥', '🥭', '🍋', '🫐'],
};

type Card = {
    id: number;
    symbol: string;
    matched: boolean;
};

export type MemoryRound = {
    cards: Card[];
    rows: number;
    cols: number;
    cells: number;
    flipBackMs: number;
};

export type MemoryAnswer = {
    firstId: number;
    secondId: number;
};

export type MemoryLayout = {
    rows: number;
    cols: number;
    cells: number;
    pairs: number;
    flipBackMs: number;
    theme: string;
};

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Resolves the board layout from params, guaranteeing an even number of cards
 * (pairs * 2). A leftover cell for odd rows*cols is rendered blank.
 */
export function readLayout(params: GameParams): MemoryLayout {
    const rows = clamp(Math.floor(toNumber(params.rows, 3)), 2, 6);
    const cols = clamp(Math.floor(toNumber(params.cols, 4)), 2, 8);
    const cells = rows * cols;
    const pairs = Math.floor(cells / 2);

    return {
        rows,
        cols,
        cells,
        pairs,
        flipBackMs: Math.max(300, Math.floor(toNumber(params.flip_back_ms, 1000))),
        theme: typeof params.theme === 'string' ? params.theme : 'animals',
    };
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function buildDeck(pairs: number, theme: string): Card[] {
    const symbols = THEMES[theme] ?? THEMES.animals;
    const chosen: string[] = [];
    for (let i = 0; i < pairs; i++) {
        chosen.push(symbols[i % symbols.length]);
    }

    const deck = shuffle(chosen.flatMap((symbol) => [symbol, symbol]));
    return deck.map((symbol, id) => ({ id, symbol, matched: false }));
}

export function createModule(params: GameParams): GameModule<MemoryRound, MemoryAnswer> {
    const layout = readLayout(params);
    let cards: Card[] = [];
    let matches = 0;
    let attempts = 0;
    let startedAt = 0;

    const find = (id: number) => cards.find((c) => c.id === id);

    return {
        init() {
            cards = buildDeck(layout.pairs, layout.theme);
            matches = 0;
            attempts = 0;
            startedAt = Date.now();
        },
        renderRound() {
            if (matches >= layout.pairs) {
                return null;
            }
            return {
                cards: cards.map((c) => ({ ...c })),
                rows: layout.rows,
                cols: layout.cols,
                cells: layout.cells,
                flipBackMs: layout.flipBackMs,
            };
        },
        onAnswer(answer) {
            const a = find(answer.firstId);
            const b = find(answer.secondId);

            if (!a || !b || a.id === b.id || a.matched || b.matched) {
                return { correct: false };
            }

            attempts += 1;

            if (a.symbol === b.symbol) {
                a.matched = true;
                b.matched = true;
                matches += 1;
                return { correct: true };
            }

            return { correct: false };
        },
        isFinished() {
            return matches >= layout.pairs;
        },
        getResult() {
            const elapsedMs = startedAt > 0 ? Date.now() - startedAt : 0;
            const score = Math.max(
                0,
                layout.pairs * 100 - (attempts - layout.pairs) * 15 - Math.floor(elapsedMs / 1000),
            );

            return {
                score,
                accuracy: attempts > 0 ? (layout.pairs / attempts) * 100 : 0,
                rounds: attempts,
                durationMs: 0,
                meta: { pairs: layout.pairs, attempts, elapsedMs },
            };
        },
    };
}

function MemoryBoard({ round, onAnswer, disabled }: GameRoundProps<MemoryRound, MemoryAnswer>) {
    const [firstId, setFirstId] = useState<number | null>(null);
    const [secondId, setSecondId] = useState<number | null>(null);
    const [locked, setLocked] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, []);

    const find = (id: number) => round.cards.find((c) => c.id === id);

    const choose = (id: number) => {
        const card = find(id);
        if (disabled || locked || !card || card.matched || id === firstId) {
            return;
        }

        if (firstId === null) {
            setFirstId(id);
            return;
        }

        const first = find(firstId);
        setSecondId(id);

        if (first && first.symbol === card.symbol) {
            onAnswer({ firstId, secondId: id });
            setFirstId(null);
            setSecondId(null);
        } else {
            setLocked(true);
            timer.current = setTimeout(() => {
                onAnswer({ firstId, secondId: id });
                setFirstId(null);
                setSecondId(null);
                setLocked(false);
            }, round.flipBackMs);
        }
    };

    const matched = round.cards.filter((c) => c.matched).length / 2;
    const totalPairs = round.cards.length / 2;

    return (
        <div className="flex w-full flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
                Pasangan ditemukan: {matched}/{totalPairs}
            </p>

            <div
                className="grid w-full max-w-md gap-2"
                style={{ gridTemplateColumns: `repeat(${round.cols}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: round.cells }, (_, index) => {
                    const card = round.cards[index];

                    if (!card) {
                        return <div key={`blank-${index}`} aria-hidden className="aspect-square" />;
                    }

                    const faceUp = card.matched || card.id === firstId || card.id === secondId;

                    return (
                        <button
                            key={card.id}
                            type="button"
                            disabled={disabled || card.matched}
                            onClick={() => choose(card.id)}
                            aria-label={faceUp ? `Kartu ${card.symbol}` : 'Kartu tertutup'}
                            className={cn(
                                'flex aspect-square min-h-12 items-center justify-center rounded-lg border text-3xl transition-[transform,background-color] sm:text-4xl',
                                faceUp
                                    ? 'border-border bg-card'
                                    : 'border-transparent bg-primary/15 text-transparent hover:bg-primary/25',
                                card.matched && 'opacity-60',
                            )}
                        >
                            {faceUp ? card.symbol : '?'}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

const memoryMatch: GameEntry<MemoryRound, MemoryAnswer> = {
    createModule,
    Round: MemoryBoard,
};

export default memoryMatch;
