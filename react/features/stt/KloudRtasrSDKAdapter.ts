import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant } from '../base/participants/functions';
import { MEETING_SERVER_API_BASE_URL } from '../shared-iframe/apiConstants';

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
 * 国家检测 API 响应类型定义.
 */
interface ICountryApiResponse {
    Data: {
        CountryId: number;
    };
    Success: boolean;
}

/**
 * 地理位置缓存数据结构.
 */
interface ILocationCache {
    isInChina: number; // 0: 不在中国, 1: 在中国
    timestamp: number; // 缓存时间戳
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
// eslint-disable-next-line @typescript-eslint/naming-convention
declare global {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
    private static readonly CACHE_KEY = 'kloud_rtasr_location_cache';
    private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 1天的毫秒数

    private _helper: IKloudRtasrHelper | null = null;
    private _store: IStore | null = null;
    private _isSDKLoaded: boolean = false;
    private _loadPromise: Promise<void> | null = null;
    private _isIpInChina: number = -1; // -1: 未检测, 0: 不在中国, 1: 在中国
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
     * 从 localStorage 读取缓存的地理位置信息.
     *
     * @returns {number | null} 返回缓存的值（0 或 1），如果缓存不存在或已过期则返回 null.
     */
    private _getLocationFromCache(): number | null {
        try {
            const cached = localStorage.getItem(KloudRtasrSDKAdapter.CACHE_KEY);

            if (!cached) {
                return null;
            }

            const cacheData: ILocationCache = JSON.parse(cached);
            const now = Date.now();
            const cacheAge = now - cacheData.timestamp;

            // 检查缓存是否过期（超过1天）
            if (cacheAge > KloudRtasrSDKAdapter.CACHE_DURATION) {
                localStorage.removeItem(KloudRtasrSDKAdapter.CACHE_KEY);
                logger.debug('Location cache expired, removed', { cacheAge });

                return null;
            }

            logger.debug('Location cache hit', { isInChina: cacheData.isInChina, cacheAge });

            return cacheData.isInChina;
        } catch (error) {
            logger.warn('Failed to read location cache', error);
            // 如果读取失败，清除可能损坏的缓存
            try {
                localStorage.removeItem(KloudRtasrSDKAdapter.CACHE_KEY);
            } catch {
                // 忽略清除缓存的错误
            }

            return null;
        }
    }

    /**
     * 将地理位置信息保存到 localStorage 缓存.
     *
     * @param {number} isInChina - 是否在中国（0 或 1）.
     * @returns {void}
     */
    private _saveLocationToCache(isInChina: number): void {
        try {
            const cacheData: ILocationCache = {
                isInChina,
                timestamp: Date.now()
            };

            localStorage.setItem(KloudRtasrSDKAdapter.CACHE_KEY, JSON.stringify(cacheData));
            logger.debug('Location cache saved', { isInChina });
        } catch (error) {
            logger.warn('Failed to save location cache', error);
        }
    }

    /**
     * 检测用户是否在中国.
     *
     * @param {boolean} useCache - 是否使用缓存结果，默认为 true.
     * @returns {Promise<boolean>} 如果用户在中国返回 true，否则返回 false.
     */
    private async getIsInChina(useCache: boolean = true): Promise<boolean> {
        // 如果使用缓存，先检查内存缓存
        if (useCache && this._isIpInChina !== -1) {
            return this._isIpInChina === 1;
        }

        // 如果使用缓存，检查 localStorage 缓存
        if (useCache) {
            const cachedValue = this._getLocationFromCache();

            if (cachedValue !== null) {
                this._isIpInChina = cachedValue;
                logger.info('Using cached location', { isInChina: cachedValue === 1 });

                return cachedValue === 1;
            }
        }

        // 如果正在检测，等待检测完成
        if (this._locationCheckPromise) {
            return this._locationCheckPromise;
        }

        // 开始检测
        this._locationCheckPromise = (async () => {
            try {
                // 使用新的 API 检测地理位置
                const response = await fetch('https://livedoc.peertime.cn/TxLiveDocumentApi/api/country/get', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer 02912174-3dcb-49eb-b9fa-6d90b390d495'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const country: ICountryApiResponse = await response.json();

                let isInChina: boolean;
                let isInChinaValue: number;

                if (country && country.Success && country.Data.CountryId !== 1) {
                    isInChina = false;
                    isInChinaValue = 0;
                } else {
                    isInChina = true;
                    isInChinaValue = 1;
                }

                // 更新内存缓存
                this._isIpInChina = isInChinaValue;

                // 保存到 localStorage 缓存（1天有效期）
                this._saveLocationToCache(isInChinaValue);

                logger.info('IP location detected', { countryId: country?.Data?.CountryId || 'unknown', isInChina });

                return isInChina;
            } catch (error) {
                // 如果检测失败，默认使用腾讯（中国）
                logger.warn('Failed to detect IP location, defaulting to China (Tencent)', error);
                this._isIpInChina = 1;
                // 即使检测失败，也缓存默认值（但可以设置较短的过期时间，这里仍使用1天）
                this._saveLocationToCache(1);

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

        const isInChina = await this.getIsInChina();
        const targetServerID = isInChina ? 3 : 4; // 3: 腾讯（中国）, 4: aws（海外）

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
     * 保存字幕到服务端.
     *
     * @param {Object} state - Redux state.
     * @param {string} userName - 用户名称.
     * @param {string} content - 字幕内容.
     * @returns {Promise<void>}
     */
    private async _saveCaptionToServer(state: any, userName: string, content: string): Promise<void> {
        try {
            // 获取 livedocInstanceId 作为 meetingId
            const livedocInstanceId = state['features/shared-iframe']?.livedocInstanceId;

            if (!livedocInstanceId) {
                logger.debug('livedocInstanceId not available, skipping caption save');

                return;
            }

            // 获取 KloudUserToken
            const kloudUserToken = localStorage.getItem('KloudUserToken');

            // 如果没有 token，userId 为 0；如果有 token，暂时也设为 0（需要从 token 或其他地方获取实际 userId）
            const userId = kloudUserToken ? 0 : 0;

            // 构建请求体
            const requestBody = {
                meetingId: livedocInstanceId,
                captions: [
                    {
                        content: content,
                        captionTime: Date.now(),
                        userId: userId,
                        userName: userName
                    }
                ]
            };

            // 构建请求头
            const headers: Record<string, string> = {
                'Content-Type': 'application/json'
            };

            if (kloudUserToken) {
                headers.UserToken = kloudUserToken;
            }

            // 发送请求
            const response = await fetch(`${MEETING_SERVER_API_BASE_URL}/meeting_caption/save_batch`, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            logger.debug('Caption saved to server successfully', { content, livedocInstanceId });
        } catch (error) {
            // 错误已在调用处处理，这里只记录
            logger.warn('Failed to save caption to server', error);
            throw error;
        }
    }

    /**
     * 处理识别结果消息.
     *
     * @param {IKloudRtasrMessage} msg - SDK 返回的消息.
     * @returns {void}
     */
    private _handleMessage(msg: IKloudRtasrMessage): void {

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

        if (!isInterim && conference) {
            this._saveCaptionToServer(state, participantName, msg.src).catch(error => {
                logger.error('Failed to save caption to server', error);
            });
        }

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
            this.getIsInChina().then(() => {
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

