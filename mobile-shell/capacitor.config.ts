import type { CapacitorConfig } from '@capacitor/cli';

// EduGame standalone Android app (Option B): the offline SPA built into `dist`
// (the 6 games + local storage) is bundled INTO the APK. No server, no BASE_URL,
// no internet required. Rebuild the SPA with `npm run build:standalone` (repo
// root) before `npx cap sync android`.
const config: CapacitorConfig = {
    appId: 'com.edugame.app', // 🔧 [ISI: final applicationId]
    appName: 'EduGame',
    webDir: 'dist',
    android: {
        backgroundColor: '#FDFDFC',
    },
};

export default config;
