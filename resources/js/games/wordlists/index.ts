import { EN_WORDS } from './en';
import { ID_WORDS } from './id';

export type Dictionary = 'id' | 'en';

const SOURCES: Record<Dictionary, string[]> = {
    id: [...new Set(ID_WORDS.map((w) => w.toLowerCase()))],
    en: [...new Set(EN_WORDS.map((w) => w.toLowerCase()))],
};

/**
 * Returns the words for a dictionary whose length falls within [min, max].
 */
export function getWords(
    dictionary: Dictionary,
    min: number,
    max: number,
): string[] {
    return SOURCES[dictionary].filter(
        (w) => w.length >= min && w.length <= max,
    );
}
