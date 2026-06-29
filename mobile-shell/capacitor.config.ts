import type { CapacitorConfig } from '@capacitor/cli';

// EduGame Android shell (Option A): the WebView loads the hosted Laravel/Inertia
// site directly, so all six games + cookie auth + score sync work as-is.
//
// 🔧 Fill these before building:
//   - server.url        : the hosted HTTPS site
//   - server.allowNavigation : the bare host(s) the WebView may navigate to
//   - appId             : final application id
const HOSTED_URL = 'https://REPLACE_WITH_BASE_URL'; // 🔧 [ISI: https://app.edugame.id]
const HOSTED_HOST = 'REPLACE_WITH_BASE_URL_HOST'; // 🔧 [ISI: app.edugame.id]

const config: CapacitorConfig = {
    appId: 'com.edugame.app', // 🔧 [ISI: final applicationId]
    appName: 'EduGame',
    webDir: 'dist', // offline fallback only; real content comes from server.url
    server: {
        url: HOSTED_URL,
        cleartext: false, // HTTPS only
        allowNavigation: [HOSTED_HOST],
    },
    android: {
        backgroundColor: '#FDFDFC',
    },
};

export default config;
