import ReducerRegistry from '../base/redux/ReducerRegistry';

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_ACTIVE, SET_SHARED_IFRAME_STATE, SET_WAS_ACTIVE_BEFORE_SCREENSHARE } from './actionTypes';

export interface ISharedIframeState {
    active?: boolean;
    docToolShow?: boolean;
    isScreenShared?: boolean;
    isWhiteboard?: boolean;
    livedocInstanceId?: string;
    ownerId?: string;
    url?: string;
    wasActiveBeforeScreenshare?: boolean;
}

const DEFAULT_STATE: ISharedIframeState = {
    active: false,
    docToolShow: false, // 默认 Hide
    livedocInstanceId: undefined,
    ownerId: undefined,
    url: undefined,
    wasActiveBeforeScreenshare: false,
    isScreenShared: false,
    isWhiteboard: false,
};

ReducerRegistry.register<ISharedIframeState>('features/shared-iframe', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_SHARED_IFRAME_STATE:
        return {
            ...state,
            ownerId: action.ownerId ?? state.ownerId,
            url: action.url ?? state.url,
            livedocInstanceId: action.livedocInstanceId ?? state.livedocInstanceId,
            isScreenShared: action.isScreenShared ?? state.isScreenShared,
            isWhiteboard: action.isWhiteboard ?? state.isWhiteboard,
            docToolShow: action.docToolShow ?? state.docToolShow,
        };
    case SET_WAS_ACTIVE_BEFORE_SCREENSHARE:
        return {
            ...state,
            wasActiveBeforeScreenshare: action.wasActive
        };
    case SET_SHARED_IFRAME_ACTIVE:
        return {
            ...state,
            active: action.active
        };
    case RESET_SHARED_IFRAME_STATE:
        return DEFAULT_STATE;
    default:
        return state;
    }
});

export type { ISharedIframeState as default };
