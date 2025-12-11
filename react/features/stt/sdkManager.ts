import { KloudRtasrSDKAdapter } from './KloudRtasrSDKAdapter';
import logger from './logger';
import { ISTTSDK } from './types';

/**
 * Manages the third-party STT SDK lifecycle.
 */
class STTSDKManager {
    private _sttSDK: ISTTSDK | null = null;
    private _deviceId: string | null = null;
    private _isSDKRunning: boolean = false;

    /**
     * Set the STT SDK instance.
     *
     * @param {ISTTSDK | null} sdk - The STT SDK instance.
     * @returns {void}
     */
    setSDK(sdk: ISTTSDK | null): void {
        this._sttSDK = sdk;
        logger.info('STT SDK instance set', { hasSDK: !!sdk });
    }

    /**
     * Start the STT SDK with the given device ID.
     *
     * @param {string} deviceId - The microphone device ID.
     * @returns {Promise<void>}
     */
    async start(deviceId: string): Promise<void> {
        if (!this._sttSDK) {
            logger.warn('STT SDK not set, cannot start');

            return;
        }

        if (this._isSDKRunning && this._deviceId === deviceId) {
            logger.debug('STT SDK already running with same device ID');

            return;
        }

        // Stop if running with different device
        if (this._isSDKRunning) {
            await this.stop();
        }

        try {
            await this._sttSDK.start(deviceId);
            this._deviceId = deviceId;
            this._isSDKRunning = true;
            logger.info('STT SDK started with device ID:', deviceId);
        } catch (error) {
            logger.error('Failed to start STT SDK:', error);
            throw error;
        }
    }

    /**
     * Stop the STT SDK.
     *
     * @returns {Promise<void>}
     */
    async stop(): Promise<void> {
        if (!this._sttSDK || !this._isSDKRunning) {
            return;
        }

        try {
            await this._sttSDK.stop();
            this._isSDKRunning = false;
            logger.info('STT SDK stopped');
        } catch (error) {
            logger.error('Failed to stop STT SDK:', error);
            throw error;
        }
    }

    /**
     * Get the current device ID.
     *
     * @returns {string | null} The current device ID.
     */
    getDeviceId(): string | null {
        return this._deviceId;
    }

    /**
     * Check if SDK is currently running.
     *
     * @returns {boolean} True if SDK is running.
     */
    isRunning(): boolean {
        return this._isSDKRunning;
    }

    /**
     * Set the speaking language ID.
     *
     * @returns {Promise<void>}
     */
    async setSpeakingLanguageID(): Promise<void> {
        if (!this._sttSDK) {
            logger.warn('STT SDK not set, cannot set speaking language ID');

            return;
        }

        // Check if SDK is KloudRtasrSDKAdapter instance
        if (this._sttSDK instanceof KloudRtasrSDKAdapter) {
            try {
                await this._sttSDK.setSpeakingLanguageID();
            } catch (error) {
                logger.error('Failed to set speaking language ID', error);
            }
        }
    }
}

// Singleton instance
export const sttSDKManager = new STTSDKManager();

