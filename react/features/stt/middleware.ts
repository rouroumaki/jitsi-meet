import { AnyAction } from 'redux';

import { IStore } from '../app/types';
import { ENDPOINT_MESSAGE_RECEIVED } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { SET_AUDIO_INPUT_DEVICE } from '../base/devices/actionTypes';
import { SET_AUDIO_MUTED } from '../base/media/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import { isLocalParticipantModerator } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_ADDED } from '../base/tracks/actionTypes';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions.any';

import { receiveRemoteSubtitle, receiveSTTStatusChanged } from './actions';
import { initializeAndStartSTT, isSTTEnabled } from './functions';
import { sttSDKManager } from './sdkManager';

/**
 * The type of json-message which indicates that json carries a
 * transcription result.
 */
const JSON_TYPE_TRANSCRIPTION_RESULT = 'transcription-result';

/**
 * The type of json-message which indicates that json carries a
 * STT status change.
 */
const JSON_TYPE_STT_STATUS_CHANGED = 'stt-status-changed';

/**
 * Implements the entry point of the middleware of the feature stt.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED: {
        return _endpointMessageReceived(store, next, action);
    }
    case PARTICIPANT_JOINED: {
        return _participantJoined(store, next, action);
    }
    case SET_AUDIO_MUTED: {
        // Check state BEFORE reducer updates to avoid duplicate handling
        const stateBefore = store.getState();
        const currentMuted = stateBefore['features/base/media'].audio.muted;

        // Only handle if state is actually changing
        if (currentMuted === action.muted) {
            // State hasn't changed, skip handling
            return next(action);
        }

        // Only handle if STT is enabled
        if (!isSTTEnabled(stateBefore)) {
            return next(action);
        }

        // Execute reducer first
        const result = next(action);

        // Handle mute/unmute after state is updated
        if (action.muted) {
            sttSDKManager.stop().catch(error => {
                console.error('Failed to stop STT SDK on mute', error);
            });
        } else {
            const stateAfter = store.getState();
            const localAudio = getLocalJitsiAudioTrack(stateAfter);

            if (localAudio) {
                const deviceId = localAudio.getDeviceId();

                if (deviceId) {
                    sttSDKManager.start(deviceId).catch(error => {
                        console.error('Failed to start STT SDK on unmute', error);
                    });
                }
            }
        }

        return result;
    }

    case SET_AUDIO_INPUT_DEVICE: {
        const result = next(action);
        const state = store.getState();

        // Only handle if STT is enabled
        if (!isSTTEnabled(state)) {
            return result;
        }

        // Wait a bit for the track to be updated with new device
        setTimeout(() => {
            const currentState = store.getState();
            const localAudio = getLocalJitsiAudioTrack(currentState);

            if (!localAudio) {
                return;
            }

            // Get new device ID from track
            const newDeviceId = localAudio.getDeviceId();
            const isMuted = localAudio.isMuted();

            if (newDeviceId && !isMuted) {
                sttSDKManager.start(newDeviceId).catch(error => {
                    console.error('Failed to start STT SDK on device change', error);
                });
            }
        }, 100);

        return result;
    }

    case TRACK_ADDED: {
        const result = next(action);
        const state = store.getState();

        // Only handle if STT is enabled and track is local audio
        if (!isSTTEnabled(state)) {
            return result;
        }

        const { track } = action;

        if (track?.local && track?.mediaType === MEDIA_TYPE.AUDIO) {
            const localAudio = getLocalJitsiAudioTrack(state);

            if (localAudio) {
                const deviceId = localAudio.getDeviceId();
                const isMuted = localAudio.isMuted();

                if (deviceId && !isMuted && sttSDKManager.isRunning() === false) {
                    sttSDKManager.start(deviceId).catch(error => {
                        console.error('Failed to start STT SDK on track added', error);
                    });
                }
            }
        }

        return result;
    }
    }

    return next(action);
});

/**
 * Handles PARTICIPANT_JOINED action to send STT status to new participants.
 *
 * @param {IStore} store - The redux store.
 * @param {Function} next - The redux dispatch function.
 * @param {AnyAction} action - The PARTICIPANT_JOINED action.
 * @returns {Object} The value returned by next(action).
 */
function _participantJoined(store: IStore, next: Function, action: AnyAction) {
    const result = next(action);
    const { participant } = action;

    // Only handle real participants, skip fake participants and local participant
    if (participant?.fakeParticipant || participant?.local) {
        return result;
    }

    const state = store.getState();
    const conference = getCurrentConference(state);

    // Only send if moderator and STT is enabled
    if (isLocalParticipantModerator(state) && isSTTEnabled(state) && conference) {
        const participantId = participant.id;

        if (participantId) {
            // Function to send STT status with retry logic
            const sendSTTStatus = (retryCount = 0) => {
                const currentState = store.getState();
                const dataChannelOpen = currentState['features/base/conference'].dataChannelOpen;

                // Check if data channel is open, or retry up to 5 times
                if (dataChannelOpen || retryCount >= 5) {
                    try {
                        // Send STT status to the newly joined participant
                        conference.sendMessage({
                            type: JSON_TYPE_STT_STATUS_CHANGED,
                            enabled: true,
                            timestamp: Date.now()
                        }, participantId);
                    } catch (error) {
                    }
                } else {
                    // Retry after 500ms if data channel is not ready
                    setTimeout(() => sendSTTStatus(retryCount + 1), 500);
                }
            };

            // Start sending after initial delay
            setTimeout(() => sendSTTStatus(), 500);
        }
    }

    return result;
}

/**
 * Handles ENDPOINT_MESSAGE_RECEIVED action to receive remote subtitles.
 *
 * @param {IStore} store - The redux store.
 * @param {Function} next - The redux dispatch function.
 * @param {AnyAction} action - The ENDPOINT_MESSAGE_RECEIVED action.
 * @returns {Object} The value returned by next(action).
 */
function _endpointMessageReceived(store: IStore, next: Function, action: AnyAction) {
    const { data: json } = action;

    console.log('ENDPOINT_MESSAGE_RECEIVED:', { type: json?.type, json });

    if (json?.type === JSON_TYPE_STT_STATUS_CHANGED) {
        // Handle STT status change from moderator
        const { dispatch } = store;
        const { enabled } = json;

        dispatch(receiveSTTStatusChanged(enabled));

        // 如果启用 STT，需要初始化 SDK 并启动
        if (enabled) {
            initializeAndStartSTT(store).catch(error => {
                console.error('Failed to initialize STT SDK after status change', error);
            });
        } else {
            // 如果禁用 STT，停止 SDK
            if (sttSDKManager.isRunning()) {
                sttSDKManager.stop().catch(error => {
                    console.error('Failed to stop STT SDK after status change', error);
                });
            }
        }

        return next(action);
    }

    // Only handle transcription-result messages
    if (json?.type !== JSON_TYPE_TRANSCRIPTION_RESULT) {
        return next(action);
    }

    const state = store.getState();

    // Only handle if STT is enabled
    if (!isSTTEnabled(state)) {
        return next(action);
    }

    const { dispatch } = store;
    const { participant, transcript, is_interim: isInterim } = json;
    const participantName = participant?.name || 'Unknown';
    const text = transcript?.[0]?.text || '';

    if (text) {
        dispatch(receiveRemoteSubtitle(participantName, text, isInterim));
    }

    return next(action);
}

