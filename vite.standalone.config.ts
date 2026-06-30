import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Builds the fully-offline standalone SPA (the 6 games + local storage) into
// mobile-shell/dist for the Capacitor APK. No Laravel/Inertia/server.
export default defineConfig({
    root: resolve(__dirname, 'resources/js/standalone'),
    base: './', // relative asset paths so it works from the APK file system
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
    build: {
        outDir: resolve(__dirname, 'mobile-shell/dist'),
        emptyOutDir: true,
    },
});
