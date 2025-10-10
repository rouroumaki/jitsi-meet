import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import { getLocalParticipant } from '../base/participants/functions';
import { showLoadingNotification } from '../notifications/actions';

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_STATE } from './actionTypes';
import SharedIframeDialog from './components/web/SharedIframeDialog';
import { SHARED_IFRAME_STATUSES } from './constants';
import { createLivedocInstance, createOrUpdateInstantAccount, sendSharedIframeCommand } from './functions';

export function setSharedIframeState(payload: {
    livedocInstanceId?: string;
    ownerId?: string;
    status: string;
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

export function startSharedIframe(url: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const conference = getCurrentConference(getState());
        const localParticipant = getLocalParticipant(getState());

        if (!conference || !url) {
            return;
        }

        // 从本地获取登录令牌
        let localToken = localStorage.getItem('KloudUserToken');

        if (!localToken) {
            const anonymousToken = await createOrUpdateInstantAccount(localParticipant?.name || '');

            localToken = anonymousToken;
        }

        const jitsiInstanceId = conference.sessionId;

        // dispatch(showLoadingNotification({
        //     title: 'Loading LiveDoc share, please wait ',
        // }));

        const livedocInstanceId = await createLivedocInstance({ userToken: localToken || '', jitsiInstanceId });

        url = `https://kloud.cn/GoogleMeet/MainStage/${livedocInstanceId}/0`;
        // dispatch(
        //     setSharedIframeState({
        //         status: SHARED_IFRAME_STATUSES.START,
        //         url,
        //         ownerId: localParticipant?.id,
        //         token,
        //     })
        // );

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
