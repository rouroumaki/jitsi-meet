import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import { getLocalParticipant } from '../base/participants/functions';
import { showLoadingNotification } from '../notifications/actions';
// import { showLoadingNotification } from '../notifications/actions';

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_ACTIVE, SET_SHARED_IFRAME_STATE, SET_WAS_ACTIVE_BEFORE_SCREENSHARE } from './actionTypes';
import SharedIframeDialog from './components/web/SharedIframeDialog';
import { SHARED_IFRAME_STATUSES } from './constants';
import { createOrUpdateInstantAccount, sendSharedIframeCommand } from './functions';

export function setSharedIframeState(payload: {
    livedocInstanceId?: string;
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

export function startSharedIframe(url: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState());
        const localParticipant = getLocalParticipant(getState());

        if (!conference || !url) {
            return;
        }

        dispatch(showLoadingNotification({
            title: 'Loading LiveDoc View, please wait ',
        }));

        // 轮询等待 livedocInstanceId 准备就绪
        const waitForLivedocInstanceId = async (maxAttempts = 30, interval = 1000): Promise<string | null> => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const state = getState();
                const { livedocInstanceId } = state['features/shared-iframe'] || {};

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
            console.error('LiveDoc instance ID not available after waiting, please try again later');

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
