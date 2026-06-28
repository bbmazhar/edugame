import AccessibilityMenu from '@/components/accessibility-menu';
import { AccessibilityProvider } from '@/hooks/use-accessibility';
import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { catalog, dashboard, home, login } from '@/routes';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;

    return (
        <AccessibilityProvider>
            <div className="flex min-h-screen flex-col bg-background text-foreground">
                <header className="border-b border-border">
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
                        <div className="flex items-center gap-6">
                            <Link
                                href={home()}
                                className="text-lg font-semibold tracking-tight"
                            >
                                EduGame
                            </Link>
                            <nav className="flex items-center gap-1 text-sm">
                                <Link
                                    href={home()}
                                    className="min-h-11 rounded-md px-3 py-1.5 hover:bg-accent"
                                >
                                    Beranda
                                </Link>
                                <Link
                                    href={catalog()}
                                    className="min-h-11 rounded-md px-3 py-1.5 hover:bg-accent"
                                >
                                    Katalog
                                </Link>
                            </nav>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                            <AccessibilityMenu />
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="min-h-11 rounded-md border border-border px-4 py-1.5 hover:bg-accent"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={login()}
                                        className="min-h-11 px-3 py-1.5 hover:underline"
                                    >
                                        Masuk
                                    </Link>
                                    {/* @chisel-registration */}
                                    <Link
                                        href={register()}
                                        className="min-h-11 rounded-md border border-border px-4 py-1.5 hover:bg-accent"
                                    >
                                        Daftar
                                    </Link>
                                    {/* @end-chisel-registration */}
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
                    {children}
                </main>

                <footer className="border-t border-border">
                    <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted-foreground">
                        <p>
                            EduGame — latihan kognitif yang seru &amp; ramah fokus
                            untuk SD, SMP, SMA, dan umum.
                        </p>
                        <p className="mt-1 text-xs">
                            &copy; {new Date().getFullYear()} EduGame. Bukan alat
                            diagnosis atau pengobatan medis.
                        </p>
                    </div>
                </footer>
            </div>
        </AccessibilityProvider>
    );
}
