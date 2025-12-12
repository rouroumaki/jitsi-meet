import { IReduxState, IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import { pinParticipant } from '../base/participants/actions';
import { getLocalParticipant, getScreenshareParticipantIds } from '../base/participants/functions';
import { toggleScreensharing } from '../base/tracks/actions.web';
import { hideLoadingNotification, showErrorNotification, showLoadingNotification } from '../notifications/actions';
import { isScreenVideoShared } from '../screen-share/functions';
import { sendForceStopScreenShare } from '../screen-share/signals';

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_ACTIVE, SET_SHARED_IFRAME_STATE, SET_WAS_ACTIVE_BEFORE_SCREENSHARE, SET_WEBCAM_VISIBLE } from './actionTypes';
import SharedIframeDialog from './components/web/SharedIframeDialog';
import { SHARED_IFRAME_STATUSES } from './constants';
import { createOrUpdateInstantAccount, sendSharedIframeCommand } from './functions';

export function setSharedIframeState(payload: {
    actionDialogVisible?: boolean;
    docToolShow?: boolean;
    isScreenShared?: boolean;
    isWhiteboard?: boolean;
    livedocInstanceId?: string;
    mainPanelVisible?: boolean;
    ownerId?: string;
    status?: string;
    token?: string;
    url?: string;
}) {
    return {
        type: SET_SHARED_IFRAME_STATE,
        ...payload,
    } as const;
}

export function resetSharedIframeState() {
    return {
        type: RESET_SHARED_IFRAME_STATE,
    } as const;
}


export function setWasActiveBeforeScreenshare(wasActive: boolean) {
    return {
        type: SET_WAS_ACTIVE_BEFORE_SCREENSHARE,
        wasActive
    } as const;
}

export function setSharedIframeActive(active: boolean) {
    return {
        type: SET_SHARED_IFRAME_ACTIVE,
        active
    } as const;
}

export function setWebcamVisible(webcamVisible: boolean) {
    return {
        type: SET_WEBCAM_VISIBLE,
        webcamVisible
    } as const;
}

/**
 * 关闭所有正在屏幕共享的参与者（包括本地参与者）.
 *
 * @param {Function} dispatch - The Redux dispatch function.
 * @param {Object} state - The Redux state.
 * @returns {void}
 */
function stopAllScreenSharing(dispatch: IStore['dispatch'], state: IReduxState): void {
    const localParticipant = getLocalParticipant(state);
    const screenshareParticipantIds = new Set([ ...getScreenshareParticipantIds(state) ]);
    const localParticipantId = localParticipant?.id;

    // 如果本地参与者正在屏幕共享，直接停止
    if (isScreenVideoShared(state)) {
        dispatch(toggleScreensharing(false));
    }

    // 关闭其他参与者的屏幕共享
    for (const participantId of screenshareParticipantIds) {
        // 跳过本地参与者，因为已经在上面的逻辑中处理了
        if (participantId !== localParticipantId) {
            dispatch(sendForceStopScreenShare(participantId));
        }
    }
}

export function startSharedIframe(url: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState());
        const localParticipant = getLocalParticipant(getState());
        const state = getState();

        if (!conference || !url) {
            return;
        }

        const { isScreenShared } = state['features/shared-iframe'] || {};

        !isScreenShared && dispatch(showLoadingNotification({
            title: 'Loading LiveDoc View, please wait ',
        }));

        // 轮询等待 livedocInstanceId 准备就绪
        const waitForLivedocInstanceId = async (maxAttempts = 20, interval = 1000): Promise<string | null> => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                // 每次迭代都获取最新的状态，而不是使用旧的 state 快照
                const currentState = getState();
                const { livedocInstanceId } = currentState['features/shared-iframe'] || {};

                if (livedocInstanceId) {
                    return livedocInstanceId;
                }

                // 如果还没有，等待一段时间后重试
                await new Promise(resolve => setTimeout(resolve, interval));
            }

            return null;
        };

        const livedocInstanceId = await waitForLivedocInstanceId();

        if (!livedocInstanceId) {
            dispatch(hideLoadingNotification());
            dispatch(showErrorNotification({
                title: 'LiveDoc instance ID not available after waiting, please try again later'
            }));

            return;
        }

        // 从本地获取登录令牌
        let localToken = localStorage.getItem('KloudUserToken');

        if (!localToken) {
            const anonymousToken = await createOrUpdateInstantAccount(localParticipant?.name || '');

            localToken = anonymousToken;
        }

        // 使用已存在的 livedocInstanceId 构建 URL
        url = `https://kloud.cn/GoogleMeet/MainStage/${livedocInstanceId}/0`;

        sendSharedIframeCommand({
            conference,
            localParticipantId: localParticipant?.id,
            status: SHARED_IFRAME_STATUSES.START,
            url,
            token: localToken || '',
        });
    };
}

export function stopSharedIframe() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);
        const localParticipant = getLocalParticipant(state);

        if (!conference) {
            return;
        }

        sendSharedIframeCommand({
            conference,
            localParticipantId: localParticipant?.id,
            status: SHARED_IFRAME_STATUSES.STOP,
        });
    };
}

export function showSharedIframeDialog(onSubmit: (url: string) => void) {
    return openDialog(SharedIframeDialog, { onSubmit });
}

export function toggleSharedIframe() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);
        const localParticipant = getLocalParticipant(state);
        const url = state['features/shared-iframe']?.url;

        if (!conference || !localParticipant) {
            return;
        }

        // 关闭所有正在屏幕共享的参与者（包括本地参与者）
        stopAllScreenSharing(dispatch, state);

        // 如果有 URL，显示已存在的 LiveDoc
        if (url) {
            dispatch(pinParticipant('livedoc'));

            sendSharedIframeCommand({
                conference,
                localParticipantId: localParticipant.id,
                status: SHARED_IFRAME_STATUSES.SHOW,
            });
        } else {
            // 启动新的 LiveDoc 实例
            dispatch(startSharedIframe('https://kloud.cn/GoogleMeet/MainStage/1234567890/0'));
        }
    };
}
