import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

interface GithubRelease {
    tag_name: string;
    assets: {
        browser_download_url: string;
        name: string;
        content_type: string;
    }[];
    html_url: string;
}

const GITHUB_REPO = "GloriousTR/CEG-Calc";
const REQS_PER_HOUR_LIMIT_WARNING = true; // Just a flag to remind us

export const checkForUpdate = async (): Promise<void> => {
    // Only check on native platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
        console.log("Not a native platform, skipping update check.");
        return;
    }

    try {
        // 1. Get current app version
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version; // e.g., "2.0.0" or "2.0"

        console.log(`Current App Version: ${currentVersion}`);

        // 2. Fetch latest release from GitHub
        // Note: This is an unauthenticated request, limited to 60/hr per IP.
        // For a small app, this is usually fine.
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);

        if (!response.ok) {
            if (response.status === 403) {
                console.warn("GitHub API rate limit exceeded for update check.");
            }
            throw new Error(`GitHub API Error: ${response.status}`);
        }

        const latestRelease: GithubRelease = await response.json();
        const latestTag = latestRelease.tag_name; // e.g., "v2.1"

        // 3. Compare versions
        // Clean tags: "v2.1" -> "2.1"
        const cleanCurrent = cleanVersion(currentVersion);
        const cleanLatest = cleanVersion(latestTag);

        console.log(`Checking update: ${cleanCurrent} vs ${cleanLatest}`);

        if (isNewer(cleanLatest, cleanCurrent)) {
            // 4. Find the APK asset
            const apkAsset = latestRelease.assets.find(asset => asset.name.endsWith('.apk'));
            const downloadUrl = apkAsset ? apkAsset.browser_download_url : latestRelease.html_url;

            // 5. Notify User using native confirm (or alert)
            // We use window.confirm for simplicity, which maps to a native dialog in Capacitor Web/Android often,
            // or we can use @capacitor/dialog if we strictly want native UI. 
            // JavaScript's confirm() works fine in Capacitor Android (shows a native-looking dialog).
            const shouldUpdate = window.confirm(
                `Yeni Güncelleme Mevcut!\n\nSürüm: ${latestTag}\n\nYenilikleri almak için şimdi güncellemek ister misiniz?`
            );

            if (shouldUpdate) {
                // 6. Open download link
                await Browser.open({ url: downloadUrl });
            }
        } else {
            console.log("App is up to date.");
        }

    } catch (error) {
        console.error("Failed to check for updates:", error);
    }
};

/**
 * Removes 'v' prefix and other noise
 */
function cleanVersion(ver: string): string {
    return ver.replace(/^v/, '').trim();
}

/**
 * Returns true if v1 > v2 (semver-ish)
 */
function isNewer(v1: string, v2: string): boolean {
    const v1Parts = v1.split('.').map(Number);
    const v2Parts = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); ++i) {
        const p1 = v1Parts[i] || 0;
        const p2 = v2Parts[i] || 0;
        if (p1 > p2) return true;
        if (p1 < p2) return false;
    }
    return false;
}
