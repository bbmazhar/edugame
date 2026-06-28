import { Head, Link } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';

export default function Landing() {
    return (
        <PublicLayout>
            <Head title="Beranda" />

            <section className="flex flex-col items-start gap-6 py-8">
                <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-[#706f6c] dark:bg-white/10 dark:text-[#A1A09A]">
                    Latihan kognitif &middot; ronde pendek &middot; ramah fokus
                </span>

                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    Mini-game otak yang seru untuk semua jenjang
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-[#706f6c] dark:text-[#A1A09A]">
                    EduGame menghadirkan kumpulan mini-game kognitif dengan
                    ronde singkat dan tampilan yang menenangkan. Cocok untuk SD,
                    SMP, SMA, hingga umum — main langsung tanpa perlu akun.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <span className="cursor-not-allowed rounded-md bg-[#1b1b18] px-5 py-2 text-sm font-medium text-white opacity-60 dark:bg-[#EDEDEC] dark:text-[#1b1b18]">
                        Katalog game segera hadir
                    </span>
                    <Link
                        href="https://laravel.com/docs"
                        className="rounded-md border border-black/10 px-5 py-2 text-sm hover:border-black/20 dark:border-white/15 dark:hover:border-white/30"
                    >
                        Pelajari lebih lanjut
                    </Link>
                </div>

                <p className="max-w-2xl text-xs text-[#706f6c] dark:text-[#A1A09A]">
                    Catatan: EduGame adalah latihan yang menyenangkan dan ramah
                    fokus. Kami tidak membuat klaim medis atau menjanjikan
                    penyembuhan kondisi apa pun.
                </p>
            </section>
        </PublicLayout>
    );
}
