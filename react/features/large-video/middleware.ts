// import { getCurrentConference } from '../base/conference/functions';
import { MEDIA_TYPE } from '../base/media/constants';
import {
    DOMINANT_SPEAKER_CHANGED,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PIN_PARTICIPANT
} from '../base/participants/actionTypes';
import { pinParticipant } from '../base/participants/actions';
import { getDominantSpeakerParticipant, getLocalParticipant, getLocalScreenShareParticipant, getVirtualScreenshareParticipantByOwnerId } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { isTestModeEnabled } from '../base/testing/functions';
import {
    TRACK_ADDED,
    TRACK_REMOVED
} from '../base/tracks/actionTypes';
import { TOGGLE_DOCUMENT_EDITING } from '../etherpad/actionTypes';
import { TOGGLE_PIN_STAGE_PARTICIPANT } from '../filmstrip/actionTypes';
import { isSharedIframePlaying } from '../shared-iframe/functions';
import { shouldDisplayTileView } from '../video-layout/functions.web';

import { selectParticipantInLargeVideo } from './actions.any';
import { getLargeVideoParticipant } from './functions';

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

        console.log('selectParticipantInLargeVideo', action);


        if (dominantSpeaker?.id === action.participant.id) {
            return next(action);
        }

        const result = next(action);

        if (isTestModeEnabled(state)) {
            // logger.debug(`Dominant speaker changed event for: ${action.participant.id}`);
        }

        const { active } = state['features/shared-iframe'] || {};

        if (localParticipant && localParticipant.id !== action.participant.id && !active) {
            store.dispatch(selectParticipantInLargeVideo());
        }

        return result;
    }
    case PIN_PARTICIPANT: {
        const result = next(action);

        console.log('selectParticipantInLargeVideo', action);

        store.dispatch(selectParticipantInLargeVideo(action.participant?.id));

        return result;
    }
    case TOGGLE_PIN_STAGE_PARTICIPANT: {
        const result = next(action);

        return result;
    }
    case PARTICIPANT_JOINED:
    case PARTICIPANT_LEFT:
    case TOGGLE_DOCUMENT_EDITING:
    case TRACK_ADDED:
    case TRACK_REMOVED: {
        const result = next(action);

        const state = store.getState();

        console.log('selectParticipantInLargeVideo', action);

        // 处理 PARTICIPANT_JOINED 中的屏幕共享 participant
        if (action.type === PARTICIPANT_JOINED) {

            if ([ FakeParticipant.RemoteScreenShare, FakeParticipant.LocalScreenShare, FakeParticipant.SharedVideo, FakeParticipant.Whiteboard ].includes(action.participant?.fakeParticipant)) {
                store.dispatch(pinParticipant(action.participant?.id ?? null));
                break;
            }

            // 当前livedoc正在显示，别切换
            if (isSharedIframePlaying(state) && !shouldDisplayTileView(state)) {
                break;
            }
        }

        if (action.type === PARTICIPANT_LEFT) {

            if (isSharedIframePlaying(state) && !shouldDisplayTileView(state)) {
                store.dispatch(pinParticipant('livedoc'));
                break;
            }

            const { active } = state['features/shared-iframe'] || {};

            if (active) {
                store.dispatch(pinParticipant('livedoc'));
                break;
            }

            // if ([ FakeParticipant.RemoteScreenShare, FakeParticipant.LocalScreenShare, FakeParticipant.SharedVideo, FakeParticipant.Whiteboard ].includes(action.participant?.fakeParticipant)) {

            // }

        }


        if (action.type === TRACK_REMOVED) {
            console.log('TRACK_REMOVED', action);

            if (action.track.jitsiTrack.type === MEDIA_TYPE.AUDIO) {
                break;
            }

        }

        // 处理 TRACK_ADDED 中的屏幕共享 track
        if (action.type === TRACK_ADDED) {
            console.log('TRACK_ADDED', action);
            if ([ MEDIA_TYPE.SCREENSHARE, MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ].includes(action.track?.mediaType)) {
                break;
            }
        }

        store.dispatch(selectParticipantInLargeVideo());

        return result;
    }
    }
    const result = next(action);

    return result;
});
