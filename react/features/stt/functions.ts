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

/**
 * Is subtitle display currently visible.
 *
 * @param {IReduxState} state - The state of the application.
 * @returns {boolean}
 */
export function isSubtitleVisible(state: IReduxState): boolean {
    return state['features/stt'].subtitleVisible;
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

