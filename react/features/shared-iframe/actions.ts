import { IStore } from "../app/types";
import { getCurrentConference } from "../base/conference/functions";
import { getLocalParticipant } from "../base/participants/functions";
import { openDialog } from "../base/dialog/actions";

import { RESET_SHARED_IFRAME_STATE, SET_SHARED_IFRAME_STATE } from "./actionTypes";
import { SHARED_IFRAME_STATUSES } from "./constants";
import { createLivedocInstance, createOrUpdateInstantAccount, sendSharedIframeCommand } from "./functions";
import SharedIframeDialog from "./components/web/SharedIframeDialog";

export function setSharedIframeState(payload: {
    status: string;
    url?: string;
    ownerId?: string;
    token?: string;
    livedocInstanceId?: string;
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
    return async (dispatch: IStore["dispatch"], getState: IStore["getState"]) => {
        const conference = getCurrentConference(getState());
        const localParticipant = getLocalParticipant(getState());
        if (!conference || !url) {
            return;
        }

        // 获取本地参与者信息
        const userName = localParticipant?.name || localParticipant?.displayName || `用户_${Date.now()}`;
        // 创建匿名会议账户
        const token = await createOrUpdateInstantAccount(userName);

        const jitsiInstanceId = conference.sessionId;
        const livedocInstanceId = await createLivedocInstance({ userToken: token, jitsiInstanceId });

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
            token,
        });
    };
}

export function stopSharedIframe() {
    return (dispatch: IStore["dispatch"], getState: IStore["getState"]) => {
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
