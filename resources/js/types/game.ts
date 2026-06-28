import type { FC } from 'react';

export type GameParams = Record<string, unknown>;

export type GameResult = {
    score: number;
    accuracy: number; // 0 - 100
    rounds: number;
    durationMs: number;
    meta?: Record<string, unknown>;
};

/**
 * Pure game logic. GameShell drives the loop: init → renderRound → onAnswer →
 * isFinished → getResult. `durationMs` in getResult may be 0; the shell
 * measures and overrides elapsed time.
 */
export type GameModule<TRound = unknown, TAnswer = unknown> = {
    init(params: GameParams): void;
    renderRound(): TRound | null;
    onAnswer(answer: TAnswer): { correct: boolean };
    isFinished(): boolean;
    getResult(): GameResult;
};

export type GameRoundProps<TRound = unknown, TAnswer = unknown> = {
    round: TRound;
    onAnswer: (answer: TAnswer) => void;
    disabled?: boolean;
};

export type GameEntry<TRound = unknown, TAnswer = unknown> = {
    createModule(params: GameParams): GameModule<TRound, TAnswer>;
    Round: FC<GameRoundProps<TRound, TAnswer>>;
    /** True when this is a stand-in (e.g. the dummy) rather than the real game. */
    prototype?: boolean;
};
