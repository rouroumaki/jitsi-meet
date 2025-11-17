import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';

import { updateLocalSubtitle } from './actions';
import logger from './logger';
import { ISTTSDK } from './types';

/**
 * KloudRtasr SDK 消息类型定义.
 */
interface IKloudRtasrMessage {
    id?: number;
    // 0: 最终结果, 1: 中间结果
    src: string;
    type: number; // 识别的文本
}

/**
 * KloudRtasrHelper 类型定义（从 SDK 推断）.
 */
interface IKloudRtasrHelper {
    OnMessage: (msg: IKloudRtasrMessage) => void;
    SetServerID: (serverId: number) => void;
    Start: (deviceId?: string) => void;
    Stop: () => void;
    SwitchDevice: (deviceId: string) => void;
}

/**
 * 全局 KloudRtasrSDK 类型定义.
 */
declare global {
    interface Window {
        KloudRtasrSDK?: {
            KloudRtasrHelper: new () => IKloudRtasrHelper;
        };
    }
}

/**
 * KloudRtasr SDK 适配器，实现 ISTTSDK 接口.
 */
export class KloudRtasrSDKAdapter implements ISTTSDK {
    private _helper: IKloudRtasrHelper | null = null;
    private _store: IStore | null = null;
    private _isSDKLoaded: boolean = false;
    private _loadPromise: Promise<void> | null = null;
    private _isInChina: boolean | null = null;
    private _locationCheckPromise: Promise<boolean> | null = null;
    private _currentServerID: number = 3; // 默认使用腾讯
    private _isRunning: boolean = false;
    private _currentDeviceId: string | null = null;

    /**
     * 构造函数.
     *
     * @param {IStore} store - Redux store 实例，用于获取会议和参与者信息.
     */
    constructor(store: IStore) {
        this._store = store;
        logger.info('KloudRtasrSDKAdapter created');
    }

    /**
     * 加载 SDK 文件.
     *
     * @returns {Promise<void>}
     */
    private async _loadSDK(): Promise<void> {
        if (this._isSDKLoaded) {
            return;
        }

        if (this._loadPromise) {
            return this._loadPromise;
        }

        this._loadPromise = new Promise((resolve, reject) => {
            // 检查 SDK 是否已经加载
            if (window.KloudRtasrSDK?.KloudRtasrHelper) {
                this._isSDKLoaded = true;
                resolve();

                return;
            }

            // 创建 script 标签加载 SDK
            const script = document.createElement('script');

            script.src = '/static/KloudRtasr.min.js';
            script.async = true;

            script.onload = () => {
                if (window.KloudRtasrSDK?.KloudRtasrHelper) {
                    this._isSDKLoaded = true;
                    logger.info('KloudRtasr SDK loaded successfully');
                    resolve();
                } else {
                    const error = new Error('KloudRtasr SDK not found after loading');

                    logger.error('Failed to load KloudRtasr SDK', error);
                    reject(error);
                }
            };

            script.onerror = () => {
                const error = new Error('Failed to load KloudRtasr SDK script');

                logger.error('Failed to load KloudRtasr SDK', error);
                reject(error);
            };

            document.head.appendChild(script);
        });

        return this._loadPromise;
    }

    /**
     * 检测用户是否在中国.
     *
     * @returns {Promise<boolean>} 如果用户在中国返回 true，否则返回 false.
     */
    private async _checkIfInChina(): Promise<boolean> {
        // 如果已经检测过，直接返回结果
        if (this._isInChina !== null) {
            return this._isInChina;
        }

        // 如果正在检测，等待检测完成
        if (this._locationCheckPromise) {
            return this._locationCheckPromise;
        }

        // 开始检测
        this._locationCheckPromise = (async () => {
            try {
                // 使用 ip-api.com 免费API检测地理位置
                const response = await fetch('https://ip-api.com/json/?fields=countryCode', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                const isInChina = data.countryCode === 'CN';

                this._isInChina = isInChina;
                logger.info('IP location detected', { countryCode: data.countryCode, isInChina });

                return isInChina;
            } catch (error) {
                // 如果检测失败，默认使用腾讯（中国）
                logger.warn('Failed to detect IP location, defaulting to China (Tencent)', error);
                this._isInChina = true;

                return true;
            } finally {
                this._locationCheckPromise = null;
            }
        })();

        return this._locationCheckPromise;
    }

    /**
     * 根据地理位置切换 ServerID 并重启服务（如果需要）.
     *
     * @param {string} deviceId - 麦克风设备 ID.
     * @returns {Promise<void>}
     */
    private async _switchServerIDIfNeeded(deviceId: string): Promise<void> {
        if (!this._helper || !this._isRunning) {
            return;
        }

        const isInChina = await this._checkIfInChina();
        const targetServerID = isInChina ? 3 : 0; // 3: 腾讯（中国）, 0: 讯飞（海外）

        // 如果当前 ServerID 与目标一致，不需要切换
        if (this._currentServerID === targetServerID) {
            logger.debug('ServerID matches location, no need to switch', { serverID: targetServerID });

            return;
        }

        logger.info('Switching ServerID based on location', {
            from: this._currentServerID,
            to: targetServerID,
            isInChina
        });

        try {
            // 停止当前服务
            this._helper.Stop();
            this._isRunning = false;

            // 切换 ServerID
            this._currentServerID = targetServerID;
            this._helper.SetServerID(targetServerID);

            // 重新启动
            this._helper.Start(deviceId);
            this._isRunning = true;
            this._currentDeviceId = deviceId;

            logger.info('ServerID switched and restarted', { serverID: targetServerID });
        } catch (error) {
            logger.error('Failed to switch ServerID', error);
            throw error;
        }
    }

    /**
     * 创建 KloudRtasrHelper 实例.
     *
     * @returns {Promise<void>}
     */
    private async _createHelper(): Promise<void> {
        if (this._helper) {
            return;
        }

        await this._loadSDK();

        if (!window.KloudRtasrSDK?.KloudRtasrHelper) {
            throw new Error('KloudRtasr SDK not available');
        }

        this._helper = new window.KloudRtasrSDK.KloudRtasrHelper();

        if (!this._helper) {
            throw new Error('KloudRtasrHelper not available');
        }

        // 默认使用腾讯（中国），不等待检测完成
        this._currentServerID = 3;
        this._helper.SetServerID(this._currentServerID);
        logger.info('ServerID set to default (Tencent)', { serverID: this._currentServerID });

        // 设置消息回调
        this._helper.OnMessage = (msg: IKloudRtasrMessage) => {
            this._handleMessage(msg);
        };

        logger.info('KloudRtasrHelper instance created');
    }

    /**
     * 处理识别结果消息.
     *
     * @param {IKloudRtasrMessage} msg - SDK 返回的消息.
     * @returns {void}
     */
    private _handleMessage(msg: IKloudRtasrMessage): void {
        // 在控制台打印识别结果
        console.log('STT 识别结果:', msg.src);

        if (!this._store) {
            logger.warn('Store not available, cannot update local subtitle');

            return;
        }

        const state = this._store.getState();
        const localParticipant = getLocalParticipant(state);

        if (!localParticipant) {
            logger.warn('Local participant not available');

            return;
        }

        // 获取参与者名称
        const participantName = localParticipant.name || '我';
        const isInterim = msg.type === 1; // type == 1 是中间结果

        // Dispatch action 更新本地字幕显示
        try {
            this._store.dispatch(updateLocalSubtitle(participantName, msg.src, isInterim));
            logger.debug('Local subtitle updated', { text: msg.src, isInterim });
        } catch (error) {
            logger.error('Failed to update local subtitle', error);
        }

        // 发送 endpoint message 广播给所有参与者
        const conference = getCurrentConference(state);

        if (conference) {
            try {
                const transcriptionMessage = {
                    type: 'transcription-result',
                    message_id: msg.id?.toString() || `stt-${Date.now()}-${Math.random()}`,
                    participant: {
                        id: localParticipant.id,
                        name: participantName,
                        avatar_url: localParticipant.avatarURL
                    },
                    transcript: [ {
                        text: msg.src
                    } ],
                    is_interim: isInterim,
                    timestamp: Date.now(),
                    language: 'zh-CN', // 默认中文
                    stability: isInterim ? 0.5 : 1.0 // 中间结果设置较低稳定性
                };

                conference.sendMessage(transcriptionMessage, '');
                logger.debug('Transcription message sent to all participants', { text: msg.src, isInterim });
            } catch (error) {
                logger.error('Failed to send transcription message', error);
            }
        }
    }

    /**
     * 启动 STT SDK.
     *
     * @param {string} deviceId - 麦克风设备 ID.
     * @returns {Promise<void>}
     */
    async start(deviceId: string): Promise<void> {
        try {
            await this._createHelper();

            if (!this._helper) {
                throw new Error('Helper not created');
            }

            this._helper.Start(deviceId);
            this._isRunning = true;
            this._currentDeviceId = deviceId;
            logger.info('KloudRtasr SDK started', { deviceId, serverID: this._currentServerID });

            // 异步检测地理位置，如果需要切换会在检测完成后自动切换
            this._checkIfInChina().then(() => {
                this._switchServerIDIfNeeded(deviceId).catch(error => {
                    logger.error('Failed to switch ServerID after location detection', error);
                });
            }).catch(error => {
                logger.error('Location detection failed', error);
            });
        } catch (error) {
            logger.error('Failed to start KloudRtasr SDK', error);
            throw error;
        }
    }

    /**
     * 停止 STT SDK.
     *
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
        if (this._helper) {
            try {
                this._helper.Stop();
                this._isRunning = false;
                this._currentDeviceId = null;
                logger.info('KloudRtasr SDK stopped');
            } catch (error) {
                logger.error('Failed to stop KloudRtasr SDK', error);
                throw error;
            }
        }
    }
}

