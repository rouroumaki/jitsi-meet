import { IReduxState, IStore } from '../app/types';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions.any';

import { KloudRtasrSDKAdapter } from './KloudRtasrSDKAdapter';
import { sttSDKManager } from './sdkManager';

/**
 * Is STT currently enabled.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isSTTEnabled(state: IReduxState): boolean {
    return state['features/stt'].enabled;
}

const STORAGE_KEY = 'stt-language-settings';

/**
 * Loads settings from localStorage.
 *
 * @returns {Object}
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        // Ignore parse errors
    }

    return null;
}

/**
 * Gets read languages from settings.
 *
 * @returns {string[]} Array of read language codes (zh, en, ko, etc.).
 */
export function getReadLanguages(): string[] {
    const settings = loadSettings();

    return settings?.readLanguages || [ 'zh' ];
}

/**
 * Gets default read language from settings.
 *
 * @returns {string} Default read language code (zh, en, ko, etc.).
 */
export function getDefaultReadLanguage(): string {
    const settings = loadSettings();
    const readLanguages = getReadLanguages();

    // If defaultReadLanguage is set and is in readLanguages, use it
    if (settings?.defaultReadLanguage && readLanguages.includes(settings.defaultReadLanguage)) {
        return settings.defaultReadLanguage;
    }

    // If only one read language, use it as default
    if (readLanguages.length === 1) {
        return readLanguages[0];
    }

    // Fallback to first read language or 'zh'
    return readLanguages[0] || 'zh';
}

/**
 * Maps language code to API format.
 *
 * @param {string} langCode - Language code (zh, en, ko, etc.).
 * @returns {string} Language code in API format (cn, en, ko, ja).
 */
export function mapLanguageToAPIFormat(langCode: string): string {
    const mapping: { [key: string]: string; } = {
        'zh': 'cn',
        'en': 'en',
        'ko': 'ko',
        'ja': 'ja'
    };

    return mapping[langCode] || langCode;
}


/**
 * Is subtitle display currently visible.
 * Reads from localStorage first, falls back to Redux state.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isSubtitleVisible(state: IReduxState): boolean {
    const savedSettings = loadSettings();

    // If localStorage has the setting, use it
    if (savedSettings && savedSettings.subtitleVisible !== undefined) {
        return savedSettings.subtitleVisible;
    }

    // Otherwise, fall back to Redux state
    return state['features/stt'].subtitleVisible || true;
}

/**
 * 初始化并启动 STT SDK（如果音频轨道可用）.
 *
 * @param {IStore} store - Redux store 实例.
 * @param {any} [existingSDK] - 可选的已存在的 SDK 实例.
 * @returns {Promise<void>}
 */
export async function initializeAndStartSTT(store: IStore, existingSDK?: any): Promise<void> {
    const state = store.getState();

    // 如果 SDK 已经在运行，不需要重新初始化
    if (sttSDKManager.isRunning()) {
        return;
    }

    try {
        // 创建 SDK 适配器实例（如果未提供）
        const sdkInstance = existingSDK || new KloudRtasrSDKAdapter(store);

        // 设置 SDK 实例
        sttSDKManager.setSDK(sdkInstance);

        // 尝试启动 SDK（如果有音频轨道）
        const localAudio = getLocalJitsiAudioTrack(state);

        if (localAudio) {
            const deviceId = localAudio.getDeviceId();
            const isMuted = localAudio.isMuted();

            if (deviceId && !isMuted) {
                await sttSDKManager.start(deviceId);
            }
        }
    } catch (error) {
        console.error('Failed to initialize and start STT SDK', error);
        throw error;
    }
}

