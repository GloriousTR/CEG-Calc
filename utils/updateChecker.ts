import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { FileOpener } from '@capacitor-community/file-opener';

export interface GithubRelease {
    tag_name: string;
    assets: {
        browser_download_url: string;
        name: string;
        content_type: string;
    }[];
    html_url: string;
    body: string; // Release notes
}

const GITHUB_REPO = "GloriousTR/CEG-Calc";

/**
 * Checks for updates and returns release info if a newer version exists.
 * Returns null if up to date or error.
 */
export const checkForUpdate = async (): Promise<GithubRelease | null> => {
    if (!Capacitor.isNativePlatform()) return null;

    try {
        const appInfo = await App.getInfo();
        const currentVersion = appInfo.version;

        console.log(`Current Version: ${currentVersion}`);

        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        if (!response.ok) throw new Error('GitHub API Error');

        const latestRelease: GithubRelease = await response.json();
        const latestTag = latestRelease.tag_name;

        const cleanCurrent = cleanVersion(currentVersion);
        const cleanLatest = cleanVersion(latestTag);

        if (isNewer(cleanLatest, cleanCurrent)) {
            return latestRelease;
        }
    } catch (error) {
        console.error("Update check failed:", error);
    }
    return null;
};

/**
 * Downloads the APK from the release asset URL.
 * updates progress callback (0-100).
 * Returns the file path of the downloaded APK.
 */
export const downloadUpdate = async (
    release: GithubRelease,
    onProgress: (progress: number) => void
): Promise<string> => {
    const apkAsset = release.assets.find(a => a.name.endsWith('.apk'));
    if (!apkAsset) throw new Error("No APK found in release");

    const downloadUrl = apkAsset.browser_download_url;
    const fileName = apkAsset.name;
    const path = `updates/${fileName}`;

    // We use fetch since Capacitor Http plugin is optional and fetch works fine for blobs
    // BUT fetch doesn't give progress. For progress, we need XMLHTTPRequest or a stream reader.
    // We'll use a simple stream reader approach for progress.

    const response = await fetch(downloadUrl);
    if (!response.body) throw new Error("Download failed: No body");

    const contentLength = response.headers.get('Content-Length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    let loaded = 0;
    const reader = response.body.getReader();
    const chunks = [];

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
            onProgress(Math.min((loaded / total) * 100, 100)); // Cap at 100
        }
    }

    // Combine chunks
    const blob = new Blob(chunks, { type: 'application/vnd.android.package-archive' });
    const base64 = await blobToBase64(blob);

    // Save to filesystem (Cache directory is best for temporary updates)
    const savedFile = await Filesystem.writeFile({
        path: path,
        data: base64,
        directory: Directory.Cache,
        recursive: true
    });

    return savedFile.uri;
};

export const installAPK = async (fileUri: string) => {
    try {
        await FileOpener.open({
            filePath: fileUri,
            contentType: 'application/vnd.android.package-archive'
        });
    } catch (e) {
        console.error("File Open Error:", e);
        throw e;
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            // extract base64 data from "data:application/xxx;base64,....."
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(blob);
    });
};

function cleanVersion(ver: string): string {
    return ver.replace(/^v/, '').trim();
}

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
