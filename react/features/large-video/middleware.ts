import { getCurrentConference } from '../base/conference/functions';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PIN_PARTICIPANT
} from '../base/participants/actionTypes';
import { getDominantSpeakerParticipant, getLocalParticipant, isLocalParticipantModerator } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { isTestModeEnabled } from '../base/testing/functions';
import {
    TRACK_ADDED,
    TRACK_REMOVED
} from '../base/tracks/actionTypes';
import { TOGGLE_DOCUMENT_EDITING } from '../etherpad/actionTypes';
import { TOGGLE_PIN_STAGE_PARTICIPANT } from '../filmstrip/actionTypes';
import { setSharedIframeActive } from '../shared-iframe/actions';
import { SHARED_IFRAME_STATUSES } from '../shared-iframe/constants';
import { sendSharedIframeCommand } from '../shared-iframe/functions';

import { selectParticipantInLargeVideo } from './actions.any';

import './subscriber';

/**
 * Middleware that catches actions related to participants and tracks and
 * dispatches an action to select a participant depicted by LargeVideo.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case DOMINANT_SPEAKER_CHANGED: {
        const state = store.getState();
        const localParticipant = getLocalParticipant(state);
        const dominantSpeaker = getDominantSpeakerParticipant(state);


        if (dominantSpeaker?.id === action.participant.id) {
            return next(action);
        }

        const result = next(action);

        if (isTestModeEnabled(state)) {
            // logger.debug(`Dominant speaker changed event for: ${action.participant.id}`);
        }

        if (localParticipant && localParticipant.id !== action.participant.id) {
            store.dispatch(selectParticipantInLargeVideo());
        }

        return result;
    }
    case PIN_PARTICIPANT: {
        const result = next(action);
        const state = store.getState();
        const localParticipant = getLocalParticipant(state);
        const conference = getCurrentConference(state);

        // 如果点击了参会者，隐藏 LiveDoc 视图
        if (action.participant?.id) {
            const { active: isLiveDocActive } = state['features/shared-iframe'] || { active: false };

            if (isLiveDocActive) {
                // 隐藏 LiveDoc 视图
                store.dispatch(setSharedIframeActive(false));

                // 只有主持人需要广播隐藏命令给其他参与者
                if (isLocalParticipantModerator(state) && conference) {
                    sendSharedIframeCommand({
                        conference,
                        localParticipantId: localParticipant?.id,
                        status: SHARED_IFRAME_STATUSES.HIDE,
                    });
                }
            }
        }

        store.dispatch(selectParticipantInLargeVideo(action.participant?.id));

        return result;
    }
    case TOGGLE_PIN_STAGE_PARTICIPANT: {
        const result = next(action);
        const state = store.getState();
        const localParticipant = getLocalParticipant(state);
        const conference = getCurrentConference(state);

        // 如果点击了参会者，隐藏 LiveDoc 视图
        if (action.participantId) {
            const { active: isLiveDocActive } = state['features/shared-iframe'] || { active: false };

            if (isLiveDocActive) {
                // 隐藏 LiveDoc 视图
                store.dispatch(setSharedIframeActive(false));

                // 只有主持人需要广播隐藏命令给其他参与者
                if (isLocalParticipantModerator(state) && conference) {
                    sendSharedIframeCommand({
                        conference,
                        localParticipantId: localParticipant?.id,
                        status: SHARED_IFRAME_STATUSES.HIDE,
                    });
                }
            }
        }

        return result;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case TOGGLE_DOCUMENT_EDITING:
    case TRACK_ADDED:
    case TRACK_REMOVED: {
        const result = next(action);

        store.dispatch(selectParticipantInLargeVideo());

        return result;
    }
    }
    const result = next(action);

    return result;
});
