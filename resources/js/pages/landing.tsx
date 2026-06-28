import PublicLayout from '@/layouts/public-layout';
import { catalog } from '@/routes';
import { Head, Link } from '@inertiajs/react';

export default function Landing() {
    return (
        <PublicLayout>
            <Head title="Beranda" />

            <section className="flex flex-col items-start gap-6 py-8">
                <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                    Latihan kognitif &middot; ronde pendek &middot; ramah fokus
                </span>

                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
                    Mini-game otak yang seru untuk semua jenjang
                </h1>

                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                    EduGame menghadirkan kumpulan mini-game kognitif dengan ronde
                    singkat dan tampilan yang menenangkan. Cocok untuk SD, SMP, SMA,
                    hingga umum — main langsung tanpa perlu akun.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                    <Link
                        href={catalog()}
                        className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                        Jelajahi game
                    </Link>
                    <Link
                        href="https://laravel.com/docs"
                        className="inline-flex min-h-11 items-center rounded-md border border-border px-5 py-2 text-sm hover:bg-accent"
                    >
                        Pelajari lebih lanjut
                    </Link>
                </div>

                <p className="max-w-2xl text-xs text-muted-foreground">
                    Catatan: EduGame adalah latihan yang menyenangkan dan ramah
                    fokus. Kami tidak membuat klaim medis atau menjanjikan
                    penyembuhan kondisi apa pun.
                </p>
            </section>
        </PublicLayout>
    );
}
