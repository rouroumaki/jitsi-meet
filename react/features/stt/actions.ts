import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { isLocalParticipantModerator } from '../base/participants/functions';
import { showErrorNotification } from '../notifications/actions';

import { CLEAR_SUBTITLE, RECEIVE_REMOTE_SUBTITLE, RECEIVE_STT_STATUS_CHANGED, SET_STT_ENABLED, SET_SUBTITLE_VISIBLE, UPDATE_LOCAL_SUBTITLE } from './actionTypes';
import { initializeAndStartSTT, isSTTEnabled } from './functions';
import logger from './logger';
import { sttSDKManager } from './sdkManager';
import { ISTTSDK } from './types';

/**
 * Updates the STT active state.
 *
 * @param {boolean} enabled - Is STT enabled.
 * @returns {{
 *      type: SET_STT_ENABLED,
 *      enabled: boolean
 * }}
 */
export function setSTTEnabledState(enabled: boolean): any {
    return {
        type: SET_STT_ENABLED,
        enabled
    };
}

/**
 * Updates the local subtitle display.
 *
 * @param {string} participantName - The name of the participant speaking.
 * @param {string} text - The transcribed text.
 * @param {boolean} isInterim - Whether this is an interim (partial) result.
 * @returns {{
 *      type: UPDATE_LOCAL_SUBTITLE,
 *      participantName: string,
 *      text: string,
 *      isInterim: boolean
 * }}
 */
export function updateLocalSubtitle(participantName: string, text: string, isInterim: boolean): any {
    return {
        type: UPDATE_LOCAL_SUBTITLE,
        participantName,
        text,
        isInterim
    };
}

/**
 * Sets the subtitle visibility.
 *
 * @param {boolean} visible - Whether subtitles should be visible.
 * @returns {{
 *      type: SET_SUBTITLE_VISIBLE,
 *      visible: boolean
 * }}
 */
export function setSubtitleVisible(visible: boolean): any {
    return {
        type: SET_SUBTITLE_VISIBLE,
        visible
    };
}

/**
 * Receives a remote subtitle from another participant.
 *
 * @param {string} participantName - The name of the participant speaking.
 * @param {string} text - The transcribed text.
 * @param {boolean} isInterim - Whether this is an interim (partial) result.
 * @returns {{
 *      type: RECEIVE_REMOTE_SUBTITLE,
 *      participantName: string,
 *      text: string,
 *      isInterim: boolean
 * }}
 */
export function receiveRemoteSubtitle(participantName: string, text: string, isInterim: boolean): any {
    return {
        type: RECEIVE_REMOTE_SUBTITLE,
        participantName,
        text,
        isInterim
    };
}

/**
 * Receives STT status change from moderator.
 *
 * @param {boolean} enabled - Whether STT is enabled.
 * @returns {{
 *      type: RECEIVE_STT_STATUS_CHANGED,
 *      enabled: boolean
 * }}
 */
export function receiveSTTStatusChanged(enabled: boolean): any {
    return {
        type: RECEIVE_STT_STATUS_CHANGED,
        enabled
    };
}

/**
 * Clears the current subtitle.
 *
 * @returns {{
 *      type: CLEAR_SUBTITLE
 * }}
 */
export function clearSubtitle(): any {
    return {
        type: CLEAR_SUBTITLE
    };
}

/**
 * Enabled/disable STT depending on the current state.
 *
 * @returns {Function}
 */
export function toggleSTT(): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (isSTTEnabled(getState())) {
            dispatch(setSTTEnabled(false));
        } else {
            dispatch(setSTTEnabled(true));
        }
    };
}

/**
 * Attempt to enable or disable STT.
 *
 * @param {boolean} enabled - Enable or disable STT.
 * @param {ISTTSDK} sttSDK - Optional third-party STT SDK instance.
 *
 * @returns {Function}
 */
export function setSTTEnabled(enabled: boolean, sttSDK?: ISTTSDK): any {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        // Check if user is moderator
        if (!isLocalParticipantModerator(state)) {
            dispatch(showErrorNotification({
                titleKey: 'notify.sttModeratorOnly'
            }));

            return;
        }

        const sttEnabled = isSTTEnabled(state);


        if (enabled === sttEnabled) {

            return;
        }

        try {
            const conference = getCurrentConference(state);

            if (enabled) {
                // 初始化并启动 SDK
                await initializeAndStartSTT({ dispatch, getState } as IStore, sttSDK);
                dispatch(setSTTEnabledState(true));

                // Notify all participants that STT is enabled
                if (conference) {
                    try {
                        conference.sendEndpointMessage('', {
                            type: 'stt-status-changed',
                            enabled: true,
                            timestamp: Date.now()
                        });
                        logger.debug('STT enabled status sent to all participants');
                    } catch (error) {
                        logger.error('Failed to send STT status to participants', error);
                    }
                }
            } else {
                // Stop SDK before disabling
                await sttSDKManager.stop();
                sttSDKManager.setSDK(null);
                dispatch(setSTTEnabledState(false));

                // Notify all participants that STT is disabled
                if (conference) {
                    try {
                        conference.sendEndpointMessage('', {
                            type: 'stt-status-changed',
                            enabled: false,
                            timestamp: Date.now()
                        });
                        logger.debug('STT disabled status sent to all participants');
                    } catch (error) {
                        logger.error('Failed to send STT status to participants', error);
                    }
                }
            }
        } catch (error) {

            dispatch(showErrorNotification({
                titleKey: 'notify.sttFailedTitle'
            }));
        }
    };
}

