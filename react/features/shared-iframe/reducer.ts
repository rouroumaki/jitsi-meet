import ReducerRegistry from '../base/redux/ReducerRegistry';

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_ACTIVE, SET_SHARED_IFRAME_STATE, SET_WAS_ACTIVE_BEFORE_SCREENSHARE, SET_WEBCAM_VISIBLE } from './actionTypes';

export interface ISharedIframeState {
    actionDialogVisible?: boolean;
    active?: boolean;
    annotationPanelVisible?: boolean;
    docToolShow?: boolean;
    isScreenShared?: boolean;
    isWhiteboard?: boolean;
    livedocInstanceId?: string;
    mainPanelVisible?: boolean;
    ownerId?: string;
    url?: string;
    wasActiveBeforeScreenshare?: boolean;
    webcamVisible?: boolean;
}

const DEFAULT_STATE: ISharedIframeState = {
    actionDialogVisible: false, // 默认操作对话框隐藏
    active: false,
    annotationPanelVisible: false, // 默认注释面板隐藏
    docToolShow: false, // 默认 Hide
    livedocInstanceId: undefined,
    mainPanelVisible: false, // 默认主面板隐藏
    ownerId: undefined,
    url: undefined,
    wasActiveBeforeScreenshare: false,
    isScreenShared: false,
    isWhiteboard: false,
    webcamVisible: false,
};

ReducerRegistry.register<ISharedIframeState>('features/shared-iframe', (state = DEFAULT_STATE, action) => {
    switch (action.type) {
    case SET_SHARED_IFRAME_STATE:
        return {
            ...state,
            actionDialogVisible: action.actionDialogVisible ?? state.actionDialogVisible,
            annotationPanelVisible: action.annotationPanelVisible ?? state.annotationPanelVisible,
            ownerId: action.ownerId ?? state.ownerId,
            url: action.url ?? state.url,
            livedocInstanceId: action.livedocInstanceId ?? state.livedocInstanceId,
            isScreenShared: action.isScreenShared ?? state.isScreenShared,
            isWhiteboard: action.isWhiteboard ?? state.isWhiteboard,
            docToolShow: action.docToolShow ?? state.docToolShow,
            mainPanelVisible: action.mainPanelVisible ?? state.mainPanelVisible,
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
    case SET_WEBCAM_VISIBLE:
        return {
            ...state,
            webcamVisible: action.webcamVisible
        };
    default:
        return state;
    }
});

export type { ISharedIframeState as default };
