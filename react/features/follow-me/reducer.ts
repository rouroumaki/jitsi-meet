import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import {
    SET_FOLLOW_ME_DEBOUNCE_TIMER,
    SET_FOLLOW_ME_LAST_SEND_TIME,
    SET_FOLLOW_ME_MODERATOR,
    SET_FOLLOW_ME_STATE
} from './actionTypes';

export interface IFollowMeState {
    debounceTimer?: number;
    lastSendTime?: number;
    moderator?: string;
    recorder?: boolean;
    state?: {
        [key: string]: string;
    };
}

/**
 * Listen for actions that contain the Follow Me feature active state, so that it can be stored.
 */
ReducerRegistry.register<IFollowMeState>(
    'features/follow-me',
    (state = {}, action): IFollowMeState => {
        switch (action.type) {

        case SET_FOLLOW_ME_MODERATOR: {
            let newState = set(state, 'moderator', action.id);

            if (action.id) {
                newState = set(newState, 'recorder', action.forRecorder);
            } else {
                // clear the state if feature becomes disabled
                newState = set(newState, 'state', undefined);
                newState = set(newState, 'recorder', undefined);
            }

            return newState;
        }
        case SET_FOLLOW_ME_STATE: {
            return set(state, 'state', action.state);
        }
        case SET_FOLLOW_ME_LAST_SEND_TIME: {
            return set(state, 'lastSendTime', action.lastSendTime);
        }
        case SET_FOLLOW_ME_DEBOUNCE_TIMER: {
            return set(state, 'debounceTimer', action.timer);
        }
        }

        return state;
    });
