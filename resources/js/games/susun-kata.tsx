import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type {
    GameEntry,
    GameModule,
    GameParams,
    GameRoundProps,
} from '@/types/game';
import { getWords } from './wordlists';
import type { Dictionary } from './wordlists';

type Cell = { r: number; c: number };
type Placement = { word: string; cells: Cell[] };

type AnagramSnapshot = {
    mode: 'anagram';
    letters: string[];
    timeMs: number;
    score: number;
    wordsFound: number;
    puzzleId: number;
};

type SearchSnapshot = {
    mode: 'search';
    grid: string[][];
    size: number;
    words: string[];
    found: string[];
    foundCells: Cell[][];
    timeMs: number;
    score: number;
};

export type SusunRound = AnagramSnapshot | SearchSnapshot;

export type SusunAnswer =
    | { type: 'word'; word: string }
    | { type: 'skip' }
    | { type: 'find'; word: string; cells: Cell[] }
    | { type: 'timeup' };

export type SusunSettings = {
    mode: 'anagram' | 'search';
    dictionary: Dictionary;
    minLen: number;
    maxLen: number;
    timeMs: number;
    gridSize: number;
};

function toNumber(value: unknown, fallback: number): number {
    const n = Number(value);

    return Number.isFinite(n) ? n : fallback;
}

export function readSettings(params: GameParams): SusunSettings {
    const mode = params.mode === 'search' ? 'search' : 'anagram';
    const dictionary: Dictionary = params.dictionary === 'en' ? 'en' : 'id';
    const minLen = Math.min(
        12,
        Math.max(2, Math.floor(toNumber(params.min_len, 3))),
    );
    const maxLen = Math.max(
        minLen,
        Math.floor(toNumber(params.max_len, minLen)),
    );
    let gridSize = Math.min(
        14,
        Math.max(4, Math.floor(toNumber(params.grid_size, 8))),
    );

    if (mode === 'search') {
        gridSize = Math.max(gridSize, maxLen);
    }

    return {
        mode,
        dictionary,
        minLen,
        maxLen,
        timeMs: Math.max(5000, Math.floor(toNumber(params.time_ms, 45000))),
        gridSize,
    };
}

function randInt(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]): T[] {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

const sortedKey = (word: string) => word.split('').sort().join('');

export function buildAnagram(words: string[]): {
    letters: string[];
    answers: string[];
} {
    const target = words[Math.floor(Math.random() * words.length)];
    const key = sortedKey(target);
    const answers = words.filter(
        (w) => w.length === target.length && sortedKey(w) === key,
    );

    let letters = target.split('');
    let tries = 0;

    do {
        letters = shuffle(target.split(''));
        tries += 1;
    } while (letters.join('') === target && tries < 10);

    return { letters: letters.map((c) => c.toUpperCase()), answers };
}

const DIRECTIONS = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
];

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function buildSearch(
    words: string[],
    size: number,
): { grid: string[][]; placements: Placement[] } {
    const pool = shuffle(words.filter((w) => w.length <= size));
    const target = Math.min(8, Math.max(4, size - 3));
    const grid: (string | null)[][] = Array.from({ length: size }, () =>
        Array(size).fill(null),
    );
    const placements: Placement[] = [];

    for (const raw of pool) {
        if (placements.length >= target) {
            break;
        }

        const word = raw.toUpperCase();

        let placed = false;

        for (let attempt = 0; attempt < 50 && !placed; attempt++) {
            const [dr, dc] =
                DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
            const r0 = randInt(0, size - 1);
            const c0 = randInt(0, size - 1);
            const cells: Cell[] = [];
            let ok = true;

            for (let i = 0; i < word.length; i++) {
                const r = r0 + dr * i;
                const c = c0 + dc * i;

                if (r < 0 || r >= size || c < 0 || c >= size) {
                    ok = false;
                    break;
                }

                const existing = grid[r][c];

                if (existing !== null && existing !== word[i]) {
                    ok = false;
                    break;
                }

                cells.push({ r, c });
            }

            if (ok) {
                cells.forEach((cell, i) => {
                    grid[cell.r][cell.c] = word[i];
                });
                placements.push({ word, cells });
                placed = true;
            }
        }
    }

    const finalGrid = grid.map((row) =>
        row.map((ch) => ch ?? ALPHABET[Math.floor(Math.random() * 26)]),
    );

    return { grid: finalGrid, placements };
}

/**
 * Independently confirms every planted word is readable along its straight,
 * contiguous line and lies within the grid. Used by tests to guarantee that
 * search puzzles are solvable.
 */
export function verifyGrid(grid: string[][], placements: Placement[]): boolean {
    const size = grid.length;

    for (const p of placements) {
        if (p.cells.length !== p.word.length || p.cells.length === 0) {
            return false;
        }

        for (let i = 0; i < p.cells.length; i++) {
            const { r, c } = p.cells[i];

            if (r < 0 || r >= size || c < 0 || c >= grid[r].length) {
                return false;
            }

            if (grid[r][c] !== p.word[i]) {
                return false;
            }

            if (i > 0) {
                const dr = p.cells[i].r - p.cells[i - 1].r;
                const dc = p.cells[i].c - p.cells[i - 1].c;

                if (
                    Math.abs(dr) > 1 ||
                    Math.abs(dc) > 1 ||
                    (dr === 0 && dc === 0)
                ) {
                    return false;
                }

                if (i > 1) {
                    const pdr = p.cells[i - 1].r - p.cells[i - 2].r;
                    const pdc = p.cells[i - 1].c - p.cells[i - 2].c;

                    if (dr !== pdr || dc !== pdc) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
}

export function createModule(
    params: GameParams,
): GameModule<SusunRound, SusunAnswer> {
    const settings = readSettings(params);
    const words = getWords(
        settings.dictionary,
        settings.minLen,
        settings.maxLen,
    );

    let score = 0;
    let wordsFound = 0;
    let attempts = 0;
    let finished = false;

    if (settings.mode === 'anagram') {
        let puzzle = buildAnagram(words);
        let answerSet = new Set(puzzle.answers);
        let puzzleId = 0;

        return {
            init() {
                score = 0;
                wordsFound = 0;
                attempts = 0;
                finished = false;
                puzzle = buildAnagram(words);
                answerSet = new Set(puzzle.answers);
                puzzleId = 0;
            },
            renderRound() {
                if (finished) {
                    return null;
                }

                return {
                    mode: 'anagram',
                    letters: [...puzzle.letters],
                    timeMs: settings.timeMs,
                    score,
                    wordsFound,
                    puzzleId,
                };
            },
            onAnswer(answer) {
                if (answer.type === 'timeup') {
                    finished = true;

                    return { correct: false };
                }

                if (answer.type === 'skip') {
                    puzzle = buildAnagram(words);
                    answerSet = new Set(puzzle.answers);
                    puzzleId += 1;

                    return { correct: false };
                }

                if (answer.type === 'word') {
                    attempts += 1;
                    const w = answer.word.toLowerCase();

                    if (answerSet.has(w)) {
                        score += w.length;
                        wordsFound += 1;
                        puzzle = buildAnagram(words);
                        answerSet = new Set(puzzle.answers);
                        puzzleId += 1;

                        return { correct: true };
                    }
                }

                return { correct: false };
            },
            isFinished() {
                return finished;
            },
            getResult() {
                return {
                    score,
                    accuracy: attempts > 0 ? (wordsFound / attempts) * 100 : 0,
                    rounds: wordsFound,
                    durationMs: 0,
                    meta: { wordsFound, mode: 'anagram' },
                };
            },
        };
    }

    const board = buildSearch(words, settings.gridSize);
    const targetWords = new Set(board.placements.map((p) => p.word));
    const found = new Map<string, Cell[]>();

    return {
        init() {
            score = 0;
            wordsFound = 0;
            attempts = 0;
            finished = false;
            found.clear();
        },
        renderRound() {
            if (finished) {
                return null;
            }

            return {
                mode: 'search',
                grid: board.grid,
                size: settings.gridSize,
                words: [...targetWords],
                found: [...found.keys()],
                foundCells: [...found.values()],
                timeMs: settings.timeMs,
                score,
            };
        },
        onAnswer(answer) {
            if (answer.type === 'timeup') {
                finished = true;

                return { correct: false };
            }

            if (answer.type === 'find') {
                attempts += 1;
                const w = answer.word.toUpperCase();

                if (targetWords.has(w) && !found.has(w)) {
                    found.set(w, answer.cells ?? []);
                    score += w.length;
                    wordsFound += 1;

                    if (found.size === targetWords.size) {
                        finished = true;
                    }

                    return { correct: true };
                }
            }

            return { correct: false };
        },
        isFinished() {
            return finished;
        },
        getResult() {
            return {
                score,
                accuracy: attempts > 0 ? (wordsFound / attempts) * 100 : 0,
                rounds: wordsFound,
                durationMs: 0,
                meta: { wordsFound, mode: 'search' },
            };
        },
    };
}

function AnagramBoard({
    round,
    onSubmit,
    onSkip,
    disabled,
}: {
    round: AnagramSnapshot;
    onSubmit: (word: string) => void;
    onSkip: () => void;
    disabled?: boolean;
}) {
    const [used, setUsed] = useState<number[]>([]);

    useEffect(() => {
        setUsed([]);
    }, [round.puzzleId]);

    const complete = used.length === round.letters.length;
    const word = used.map((i) => round.letters[i]).join('');

    const submit = () => {
        if (!complete || disabled) {
            return;
        }

        onSubmit(word);
        setUsed([]);
    };

    return (
        <div className="flex w-full flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground">
                Susun semua huruf menjadi kata
            </p>

            <div className="flex min-h-14 min-w-48 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4">
                {used.length > 0 ? (
                    used.map((i, k) => (
                        <span key={k} className="text-2xl font-bold">
                            {round.letters[i]}
                        </span>
                    ))
                ) : (
                    <span className="text-muted-foreground">…</span>
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {round.letters.map((ch, i) => (
                    <button
                        key={i}
                        type="button"
                        disabled={disabled || used.includes(i)}
                        onClick={() =>
                            setUsed((u) => (u.includes(i) ? u : [...u, i]))
                        }
                        className="min-h-14 min-w-14 rounded-xl border border-border bg-card text-2xl font-bold hover:bg-accent disabled:opacity-30"
                    >
                        {ch}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                    type="button"
                    disabled={disabled || used.length === 0}
                    onClick={() => setUsed((u) => u.slice(0, -1))}
                    className="min-h-11 rounded-md border border-border px-4 py-2 text-sm disabled:opacity-40"
                >
                    Hapus
                </button>
                <button
                    type="button"
                    disabled={disabled || !complete}
                    onClick={submit}
                    className="min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-40"
                >
                    Cek
                </button>
                <button
                    type="button"
                    disabled={disabled}
                    onClick={onSkip}
                    className="min-h-11 rounded-md border border-border px-4 py-2 text-sm"
                >
                    Kata baru
                </button>
            </div>

            <p className="text-xs text-muted-foreground">
                Kata ditemukan: {round.wordsFound}
            </p>
        </div>
    );
}

function SearchBoard({
    round,
    onFind,
    disabled,
}: {
    round: SearchSnapshot;
    onFind: (word: string, cells: Cell[]) => void;
    disabled?: boolean;
}) {
    const [first, setFirst] = useState<Cell | null>(null);

    const foundSet = useMemo(
        () => new Set(round.foundCells.flat().map((c) => `${c.r},${c.c}`)),
        [round.foundCells],
    );

    const lineCells = (a: Cell, b: Cell): Cell[] | null => {
        const straight =
            a.r === b.r ||
            a.c === b.c ||
            Math.abs(b.r - a.r) === Math.abs(b.c - a.c);

        if (!straight) {
            return null;
        }

        const dr = Math.sign(b.r - a.r);
        const dc = Math.sign(b.c - a.c);
        const len = Math.max(Math.abs(b.r - a.r), Math.abs(b.c - a.c)) + 1;

        return Array.from({ length: len }, (_, i) => ({
            r: a.r + dr * i,
            c: a.c + dc * i,
        }));
    };

    const tap = (r: number, c: number) => {
        if (disabled) {
            return;
        }

        if (!first) {
            setFirst({ r, c });

            return;
        }

        const cells = lineCells(first, { r, c });
        setFirst(null);

        if (!cells) {
            return;
        }

        const str = cells.map((p) => round.grid[p.r][p.c]).join('');
        const reversed = [...str].reverse().join('');

        if (round.words.includes(str)) {
            onFind(str, cells);
        } else if (round.words.includes(reversed)) {
            onFind(reversed, [...cells].reverse());
        }
    };

    return (
        <div className="flex w-full flex-col items-center gap-4">
            <div
                className="grid w-full max-w-md gap-1"
                style={{
                    gridTemplateColumns: `repeat(${round.size}, minmax(0, 1fr))`,
                }}
            >
                {round.grid.map((row, r) =>
                    row.map((ch, c) => {
                        const key = `${r},${c}`;
                        const isFound = foundSet.has(key);
                        const isFirst = first?.r === r && first?.c === c;

                        return (
                            <button
                                key={key}
                                type="button"
                                disabled={disabled}
                                onClick={() => tap(r, c)}
                                aria-label={`Huruf ${ch}`}
                                className={cn(
                                    'flex aspect-square min-h-9 items-center justify-center rounded text-sm font-bold sm:min-h-10 sm:text-base',
                                    isFound
                                        ? 'bg-primary text-primary-foreground'
                                        : isFirst
                                          ? 'bg-accent ring-2 ring-primary'
                                          : 'bg-card hover:bg-accent',
                                )}
                            >
                                {ch}
                            </button>
                        );
                    }),
                )}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
                {round.words.map((w) => (
                    <span
                        key={w}
                        className={cn(
                            'rounded px-2 py-1 text-sm',
                            round.found.includes(w)
                                ? 'text-muted-foreground line-through'
                                : 'bg-muted',
                        )}
                    >
                        {w}
                    </span>
                ))}
            </div>
        </div>
    );
}

function SusunKataBoard({
    round,
    onAnswer,
    disabled,
}: GameRoundProps<SusunRound, SusunAnswer>) {
    const [remaining, setRemaining] = useState(round.timeMs);
    const firedRef = useRef(false);

    useEffect(() => {
        firedRef.current = false;
        setRemaining(round.timeMs);
        const start = Date.now();

        const id = setInterval(() => {
            const left = Math.max(0, round.timeMs - (Date.now() - start));
            setRemaining(left);

            if (left <= 0) {
                clearInterval(id);

                if (!firedRef.current) {
                    firedRef.current = true;
                    onAnswer({ type: 'timeup' });
                }
            }
        }, 200);

        return () => clearInterval(id);
        // The countdown runs once per mount (a session); puzzles change inside it.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const pct = Math.round((remaining / round.timeMs) * 100);

    return (
        <div className="flex w-full flex-col items-center gap-5">
            <div className="h-2 w-full max-w-sm overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${pct}%` }}
                    aria-hidden
                />
            </div>
            <p className="text-xs text-muted-foreground">
                {Math.ceil(remaining / 1000)} detik · Skor {round.score}
            </p>

            {round.mode === 'anagram' ? (
                <AnagramBoard
                    round={round}
                    disabled={disabled}
                    onSubmit={(word) => onAnswer({ type: 'word', word })}
                    onSkip={() => onAnswer({ type: 'skip' })}
                />
            ) : (
                <SearchBoard
                    round={round}
                    disabled={disabled}
                    onFind={(word, cells) =>
                        onAnswer({ type: 'find', word, cells })
                    }
                />
            )}
        </div>
    );
}

const susunKata: GameEntry<SusunRound, SusunAnswer> = {
    createModule,
    Round: SusunKataBoard,
};

export default susunKata;
