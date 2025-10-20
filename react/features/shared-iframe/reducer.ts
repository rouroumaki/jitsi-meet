import ReducerRegistry from '../base/redux/ReducerRegistry';

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_ACTIVE, SET_SHARED_IFRAME_STATE, SET_WAS_ACTIVE_BEFORE_SCREENSHARE } from './actionTypes';

export interface ISharedIframeState {
    active: boolean;
    livedocInstanceId?: string;
    ownerId?: string;
    url?: string;
    wasActiveBeforeScreenshare?: boolean;
}

const DEFAULT_STATE: ISharedIframeState = {
    active: false,
    url: undefined,
    ownerId: undefined,
    livedocInstanceId: undefined,
    wasActiveBeforeScreenshare: false,
};

ReducerRegistry.register<ISharedIframeState>('features/shared-iframe', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_SHARED_IFRAME_STATE:
        return {
            ...state,
            ownerId: action.ownerId ?? state.ownerId,
            url: action.url ?? state.url,
            livedocInstanceId: action.livedocInstanceId ?? state.livedocInstanceId,
        };
    case SET_SHARED_IFRAME_ACTIVE:
        return {
            ...state,
            active: action.active
        };
    case SET_WAS_ACTIVE_BEFORE_SCREENSHARE:
        return {
            ...state,
            wasActiveBeforeScreenshare: action.wasActive
        };
    case RESET_SHARED_IFRAME_STATE:
        return DEFAULT_STATE;
    default:
        return state;
    }
});

export type { ISharedIframeState as default };
