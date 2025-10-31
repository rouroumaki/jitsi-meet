import { IStore } from '../app/types';
import { CONFERENCE_JOINED, ENDPOINT_MESSAGE_RECEIVED } from '../base/conference/actionTypes';
import { MEDIA_TYPE } from '../base/media/constants';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { toggleScreensharing } from '../base/tracks/actions.web';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { SET_SCREENSHARE_CAPTURE_FRAME_RATE, SET_SCREEN_AUDIO_SHARE_STATE } from './actionTypes';
import { FORCE_STOP_SCREENSHARE } from './signals';

declare const APP: any;

/**
 * Implements the middleware of the feature screen-share.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { getState } = store;
    const state = getState();

    switch (action.type) {
    case CONFERENCE_JOINED: {
        _setScreenshareCaptureFps(store);
        break;
    }
    case SET_SCREENSHARE_CAPTURE_FRAME_RATE: {
        const { captureFrameRate } = action;

        _setScreenshareCaptureFps(store, captureFrameRate);
        break;
    }

    case SET_SCREEN_AUDIO_SHARE_STATE: {
        const { isSharingAudio } = action;
        const { participantId } = state['features/large-video'];

        if (isSharingAudio) {
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.AUDIO, 'playing', participantId);
        } else {
            APP.API.notifyAudioOrVideoSharingToggled(MEDIA_TYPE.AUDIO, 'stop', participantId);
        }
        break;
    }

    // case TRACK_ADDED: {
    //     const { track } = action;

    //     // 检测是否为本地屏幕共享轨道
    //     if (track.local && track.mediaType === MEDIA_TYPE.SCREENSHARE) {
    //         // 如果本地用户是主持人且 Follow Me 开启，则 pin 到屏幕共享
    //         // 这会触发 Follow Me 广播，让所有参会者同步切换到屏幕共享
    //         if (isLocalParticipantModerator(state) && isFollowMeActive(store)) {
    //             const localScreenshareParticipantId = track.participantId;

    //             if (localScreenshareParticipantId) {
    //                 logger.log(`Moderator started screensharing, pinning to: ${localScreenshareParticipantId}`);
    //                 store.dispatch(togglePinStageParticipant(localScreenshareParticipantId));
    //             }
    //         }
    //     }
    //     break;
    // }

    case ENDPOINT_MESSAGE_RECEIVED: {
        const { data } = action as any;

        if (data?.name === FORCE_STOP_SCREENSHARE) {
            // 收到打断指令：停止本地屏幕共享并提示
            store.dispatch(toggleScreensharing(false));

            const byName = data?.byName;

            if (byName) {
                store.dispatch(showNotification({
                    titleKey: 'screenshare.interruptedBy',
                    titleArguments: { name: byName }
                }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
            }
        }
        break;
    }
    }

    return result;
});

/**
 * Sets the capture frame rate for screenshare.
 *
 * @param {Store} store - The redux store.
 * @param {number} frameRate - Frame rate to be configured.
 * @private
 * @returns {void}
 */
function _setScreenshareCaptureFps(store: IStore, frameRate?: number) {
    const state = store.getState();
    const { conference } = state['features/base/conference'];
    const { captureFrameRate } = state['features/screen-share'];
    const screenShareFps = frameRate ?? captureFrameRate;

    if (!conference) {
        return;
    }

    if (screenShareFps) {
        // no-op
        conference.setDesktopSharingFrameRate(screenShareFps);
    }

}
