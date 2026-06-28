import { useAccessibility } from '@/hooks/use-accessibility';
import { cn } from '@/lib/utils';
import type { AccessibilitySettings } from '@/types/ui';
import { Accessibility } from 'lucide-react';

function ToggleRow({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: () => void;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            className="flex min-h-11 w-full items-center justify-between gap-4 rounded-md px-3 py-2 text-sm hover:bg-accent"
        >
            <span>{label}</span>
            <span
                aria-hidden
                className={cn(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors',
                    checked ? 'bg-primary' : 'bg-muted',
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                        checked && 'translate-x-5',
                    )}
                />
            </span>
        </button>
    );
}

function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    return (
        <div className="px-3 py-2">
            <p className="mb-1 text-xs text-muted-foreground">{label}</p>
            <div className="flex gap-1">
                {options.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        aria-pressed={value === option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'min-h-11 flex-1 rounded-md border px-3 text-sm transition-colors',
                            value === option.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:bg-accent',
                        )}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function AccessibilityMenu() {
    const { settings, update } = useAccessibility();

    return (
        <details className="group relative">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent [&::-webkit-details-marker]:hidden">
                <Accessibility className="h-5 w-5" aria-hidden />
                <span className="hidden sm:inline">Aksesibilitas</span>
            </summary>

            <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-border bg-card p-2 text-card-foreground shadow-lg">
                <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                    Atur kenyamanan bermain
                </p>

                <ToggleRow
                    label="Kurangi animasi"
                    checked={settings.reduced_motion}
                    onChange={() => update({ reduced_motion: !settings.reduced_motion })}
                />
                <ToggleRow
                    label="Kontras tinggi"
                    checked={settings.high_contrast}
                    onChange={() => update({ high_contrast: !settings.high_contrast })}
                />
                <ToggleRow
                    label="Suara"
                    checked={settings.sound}
                    onChange={() => update({ sound: !settings.sound })}
                />

                <Segmented<AccessibilitySettings['theme']>
                    label="Tema"
                    value={settings.theme}
                    onChange={(theme) => update({ theme })}
                    options={[
                        { value: 'calm', label: 'Tenang' },
                        { value: 'default', label: 'Standar' },
                    ]}
                />
                <Segmented<AccessibilitySettings['font']>
                    label="Huruf"
                    value={settings.font}
                    onChange={(font) => update({ font })}
                    options={[
                        { value: 'default', label: 'Standar' },
                        { value: 'dyslexic', label: 'Ramah disleksia' },
                    ]}
                />
            </div>
        </details>
    );
}
