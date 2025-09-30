import ReducerRegistry from "../base/redux/ReducerRegistry";

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_STATE } from "./actionTypes";

export interface ISharedIframeState {
    active: boolean;
    url?: string;
    ownerId?: string;
    livedocInstanceId?: string;
}

const DEFAULT_STATE: ISharedIframeState = {
    active: false,
    url: undefined,
    ownerId: undefined,
    livedocInstanceId: undefined,
};

ReducerRegistry.register<ISharedIframeState>("features/shared-iframe", (state = DEFAULT_STATE, action) => {
    switch (action.type) {
        case SET_SHARED_IFRAME_STATE:
            return {
                ...state,
                active: action.status !== "stop",
                ownerId: action.ownerId ?? state.ownerId,
                url: action.url ?? state.url,
                livedocInstanceId: action.livedocInstanceId ?? state.livedocInstanceId,
            };
        case RESET_SHARED_IFRAME_STATE:
            return DEFAULT_STATE;
        default:
            return state;
    }
});

export type { ISharedIframeState as default };
