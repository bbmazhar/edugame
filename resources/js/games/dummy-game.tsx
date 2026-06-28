import type { GameEntry, GameModule, GameParams, GameRoundProps } from '@/types/game';

type DummyRound = {
    prompt: number;
    options: number[];
};

function readRounds(params: GameParams): number {
    const raw = (params.rounds ?? params.total_questions ?? 5) as number;
    return Math.min(20, Math.max(1, Math.floor(Number(raw) || 5)));
}

function buildRound(): DummyRound {
    const prompt = 1 + Math.floor(Math.random() * 9);
    const options = new Set<number>([prompt]);

    while (options.size < 4) {
        options.add(1 + Math.floor(Math.random() * 9));
    }

    return {
        prompt,
        options: [...options].sort(() => Math.random() - 0.5),
    };
}

function createModule(params: GameParams): GameModule<DummyRound, number> {
    const total = readRounds(params);
    let index = 0;
    let correct = 0;
    let current: DummyRound | null = null;

    return {
        init() {
            index = 0;
            correct = 0;
            current = buildRound();
        },
        renderRound() {
            return index < total ? current : null;
        },
        onAnswer(answer) {
            const isCorrect = current !== null && answer === current.prompt;

            if (isCorrect) {
                correct += 1;
            }

            index += 1;
            current = index < total ? buildRound() : null;

            return { correct: isCorrect };
        },
        isFinished() {
            return index >= total;
        },
        getResult() {
            return {
                score: correct * 10,
                accuracy: total > 0 ? (correct / total) * 100 : 0,
                rounds: total,
                durationMs: 0,
            };
        },
    };
}

function Round({ round, onAnswer, disabled }: GameRoundProps<DummyRound, number>) {
    return (
        <div className="flex flex-col items-center gap-6">
            <p className="text-muted-foreground">Ketuk angka yang sama dengan</p>
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10 text-5xl font-bold text-primary">
                {round.prompt}
            </div>
            <div className="grid grid-cols-2 gap-3">
                {round.options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        disabled={disabled}
                        onClick={() => onAnswer(option)}
                        className="flex min-h-16 min-w-20 items-center justify-center rounded-xl border border-border bg-card text-2xl font-semibold hover:bg-accent disabled:opacity-50"
                    >
                        {option}
                    </button>
                ))}
            </div>
        </div>
    );
}

const dummyGame: GameEntry<DummyRound, number> = {
    createModule,
    Round,
    prototype: true,
};

export default dummyGame;
