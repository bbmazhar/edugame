import { Link, usePage } from '@inertiajs/react';
import type { PropsWithChildren } from 'react';
import { dashboard, home, login } from '@/routes';
/* @chisel-registration */
import { register } from '@/routes';
/* @end-chisel-registration */

export default function PublicLayout({ children }: PropsWithChildren) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
            <header className="border-b border-black/5 dark:border-white/10">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4">
                    <Link
                        href={home()}
                        className="text-lg font-semibold tracking-tight"
                    >
                        EduGame
                    </Link>
                    <nav className="flex items-center gap-3 text-sm">
                        {auth.user ? (
                            <Link
                                href={dashboard()}
                                className="rounded-md border border-black/10 px-4 py-1.5 hover:border-black/20 dark:border-white/15 dark:hover:border-white/30"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={login()}
                                    className="px-3 py-1.5 hover:underline"
                                >
                                    Masuk
                                </Link>
                                {/* @chisel-registration */}
                                <Link
                                    href={register()}
                                    className="rounded-md border border-black/10 px-4 py-1.5 hover:border-black/20 dark:border-white/15 dark:hover:border-white/30"
                                >
                                    Daftar
                                </Link>
                                {/* @end-chisel-registration */}
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
                {children}
            </main>

            <footer className="border-t border-black/5 dark:border-white/10">
                <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-[#706f6c] dark:text-[#A1A09A]">
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
    );
}
