import { router, usePage } from '@inertiajs/react';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from 'react';
import type { AccessibilitySettings } from '@/types/ui';

const STORAGE_KEY = 'accessibility';

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
    reduced_motion: false,
    sound: true,
    theme: 'calm',
    high_contrast: false,
    font: 'default',
};

const readLocal = (): Partial<AccessibilitySettings> => {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as Partial<AccessibilitySettings>) : {};
    } catch {
        return {};
    }
};

const writeLocal = (settings: AccessibilitySettings): void => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};

const applyClasses = (settings: AccessibilitySettings): void => {
    if (typeof document === 'undefined') {
        return;
    }

    const el = document.documentElement;
    el.classList.toggle('reduce-motion', settings.reduced_motion);
    el.classList.toggle('high-contrast', settings.high_contrast);
    el.classList.toggle('theme-calm', settings.theme === 'calm');
    el.classList.toggle('font-dyslexic', settings.font === 'dyslexic');
};

/**
 * Applies the locally-stored preferences as early as possible (called from app.tsx)
 * to avoid a flash of unstyled accessibility state before React mounts.
 */
export function initializeAccessibility(): void {
    const settings = { ...DEFAULT_ACCESSIBILITY, ...readLocal() };
    applyClasses(settings);
}

type AccessibilityContextValue = {
    settings: AccessibilitySettings;
    update: (partial: Partial<AccessibilitySettings>) => void;
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export function AccessibilityProvider({ children }: PropsWithChildren) {
    const page = usePage().props;
    const isAuthenticated = Boolean(page.auth?.user);
    const serverSettings = page.accessibility;

    const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);

    // Reconcile on mount: for guests, localStorage wins; for authenticated
    // users, the server-stored profile is the source of truth.
    useEffect(() => {
        const initial: AccessibilitySettings = isAuthenticated && serverSettings
            ? { ...DEFAULT_ACCESSIBILITY, ...readLocal(), ...serverSettings }
            : { ...DEFAULT_ACCESSIBILITY, ...readLocal() };

        setSettings(initial);
        applyClasses(initial);
        writeLocal(initial);
        // Run once on mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const update = useCallback(
        (partial: Partial<AccessibilitySettings>) => {
            setSettings((prev) => {
                const next = { ...prev, ...partial };
                applyClasses(next);
                writeLocal(next);

                if (isAuthenticated) {
                    router.patch('/settings/accessibility', partial, {
                        preserveScroll: true,
                        preserveState: true,
                    });
                }

                return next;
            });
        },
        [isAuthenticated],
    );

    return (
        <AccessibilityContext.Provider value={{ settings, update }}>
            {children}
        </AccessibilityContext.Provider>
    );
}

export function useAccessibility(): AccessibilityContextValue {
    const context = useContext(AccessibilityContext);

    if (!context) {
        throw new Error('useAccessibility must be used within an AccessibilityProvider');
    }

    return context;
}
