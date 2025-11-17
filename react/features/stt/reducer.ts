import ReducerRegistry from '../base/redux/ReducerRegistry';

import {
    CLEAR_SUBTITLE,
    RECEIVE_REMOTE_SUBTITLE,
    RECEIVE_STT_STATUS_CHANGED,
    SET_STT_ENABLED,
    SET_SUBTITLE_VISIBLE,
    UPDATE_LOCAL_SUBTITLE
} from './actionTypes';

export interface ILocalSubtitle {
    isInterim: boolean;
    participantName: string;
    text: string;
    timestamp: number;
}

export interface ISTTState {
    currentSubtitle: ILocalSubtitle | null;
    enabled: boolean;
    subtitleVisible: boolean;
}

const STORE_NAME = 'features/stt';

const DEFAULT_STATE: ISTTState = {
    enabled: false,
    subtitleVisible: true,
    currentSubtitle: null
};

/**
 * Reduces the Redux actions of the feature features/stt.
 */
ReducerRegistry.register<ISTTState>(STORE_NAME,
(state = DEFAULT_STATE, action): ISTTState => {
    const { enabled } = action;

    switch (action.type) {
    case SET_STT_ENABLED:
    case RECEIVE_STT_STATUS_CHANGED:
        return {
            ...state,
            enabled
        };
    case SET_SUBTITLE_VISIBLE: {
        const { visible } = action;

        return {
            ...state,
            subtitleVisible: visible
        };
    }
    case UPDATE_LOCAL_SUBTITLE:
    case RECEIVE_REMOTE_SUBTITLE: {
        const { participantName, text, isInterim } = action;

        return {
            ...state,
            currentSubtitle: {
                participantName,
                text,
                isInterim,
                timestamp: Date.now()
            }
        };
    }
    case CLEAR_SUBTITLE:
        return {
            ...state,
            currentSubtitle: null
        };
    default:
        return state;
    }
});

