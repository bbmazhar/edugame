import { describe, expect, it } from 'vitest';
import { buildAnagram, buildSearch, createModule, verifyGrid } from './susun-kata';
import { getWords } from './wordlists';

const sorted = (w: string) => w.toLowerCase().split('').sort().join('');

describe('wordlist', () => {
    it('filters words by length range', () => {
        const words = getWords('id', 3, 4);
        expect(words.length).toBeGreaterThan(0);
        words.forEach((w) => {
            expect(w.length).toBeGreaterThanOrEqual(3);
            expect(w.length).toBeLessThanOrEqual(4);
            expect(w).toMatch(/^[a-z]+$/);
        });
    });
});

describe('anagram generation', () => {
    it('letters are a permutation of a real dictionary word', () => {
        const pool = getWords('id', 3, 6);
        for (let i = 0; i < 200; i++) {
            const { letters, answers } = buildAnagram(pool);
            expect(answers.length).toBeGreaterThanOrEqual(1);
            expect(sorted(letters.join(''))).toBe(sorted(answers[0]));
            answers.forEach((a) => {
                expect(pool).toContain(a);
                expect(a.length).toBe(letters.length);
            });
        }
    });
});

describe('word-search generation is verifiable', () => {
    it('every planted word is readable along its line within the grid', () => {
        const pool = getWords('id', 5, 8);
        for (let i = 0; i < 200; i++) {
            const size = i % 2 === 0 ? 8 : 10;
            const { grid, placements } = buildSearch(pool, size);
            expect(grid).toHaveLength(size);
            expect(placements.length).toBeGreaterThanOrEqual(1);
            placements.forEach((p) => expect(p.word.length).toBeLessThanOrEqual(size));
            expect(verifyGrid(grid, placements)).toBe(true);
        }
    });
});

describe('anagram module scoring (word length)', () => {
    const params = { mode: 'anagram', min_len: 3, max_len: 6, dictionary: 'id', time_ms: 45000, grid_size: 0 };

    it('a correct solve scores the word length', () => {
        const mod = createModule(params);
        mod.init();
        const round = mod.renderRound();
        if (!round || round.mode !== 'anagram') throw new Error('expected anagram round');

        const key = sorted(round.letters.join(''));
        const valid = getWords('id', 3, 6).find((w) => sorted(w) === key)!;

        expect(mod.onAnswer({ type: 'word', word: valid })).toEqual({ correct: true });
        mod.onAnswer({ type: 'timeup' });

        const result = mod.getResult();
        expect(result.score).toBe(valid.length);
        expect(result.rounds).toBe(1);
    });

    it('a wrong word does not score and is not punished', () => {
        const mod = createModule(params);
        mod.init();
        expect(mod.onAnswer({ type: 'word', word: 'zzzzzz' })).toEqual({ correct: false });
        mod.onAnswer({ type: 'timeup' });
        expect(mod.getResult().score).toBe(0);
    });
});

describe('search module scoring (word length)', () => {
    const params = { mode: 'search', min_len: 5, max_len: 8, dictionary: 'id', time_ms: 60000, grid_size: 8 };

    it('finding a planted word scores its length', () => {
        const mod = createModule(params);
        mod.init();
        const round = mod.renderRound();
        if (!round || round.mode !== 'search') throw new Error('expected search round');

        const word = round.words[0];
        expect(mod.onAnswer({ type: 'find', word, cells: [] })).toEqual({ correct: true });

        const result = mod.getResult();
        expect(result.score).toBe(word.length);
    });

    it('time up finishes the game', () => {
        const mod = createModule(params);
        mod.init();
        expect(mod.isFinished()).toBe(false);
        mod.onAnswer({ type: 'timeup' });
        expect(mod.isFinished()).toBe(true);
    });
});
