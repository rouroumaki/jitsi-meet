import { CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getLocalParticipant, getScreenshareParticipantIds } from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { TRACK_ADDED, TRACK_REMOVED, TRACK_UPDATED } from '../base/tracks/actionTypes';
import { showLoadingNotification } from '../notifications/actions';
import { setTileView } from '../video-layout/actions.any';

import { resetSharedIframeState, setSharedIframeActive, setSharedIframeState, setWasActiveBeforeScreenshare } from './actions';
import { SHARED_IFRAME, SHARED_IFRAME_STATUSES } from './constants';
import { createOrUpdateInstantAccount } from './functions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOIN_IN_PROGRESS: {
        const { conference } = action;

        conference.addCommandListener(
                    SHARED_IFRAME,
                    async ({
                        value,
                        attributes,
                    }: {
                        attributes: { from: string; state: string; token: string; };
                        value: string;
                    }) => {
                        const ownerId = attributes.from;
                        const status = attributes.state;
                        const token = attributes.token;
                        const state = getState();
                        const { url: _currentUrl } = state['features/shared-iframe'] || {};

                        if (status === SHARED_IFRAME_STATUSES.STOP) {
                            // Remove the iframe participant when stopping
                            // dispatch(participantLeft(currentUrl ?? '', conference, {
                            //     fakeParticipant: FakeParticipant.SharedIframe
                            // }));
                            dispatch(resetSharedIframeState());

                            return;
                        }

                        // 处理视图显示/隐藏状态
                        if (status === SHARED_IFRAME_STATUSES.SHOW) {
                            // 显示 LiveDoc 视图
                            dispatch(setTileView(false)); // 关闭 tile view

                            dispatch(setSharedIframeActive(true)); // 显示 livedoc

                            return;
                        }

                        if (status === SHARED_IFRAME_STATUSES.HIDE) {
                            // 隐藏 LiveDoc 视图
                            dispatch(setSharedIframeActive(false)); // 隐藏 livedoc

                            return;
                        }

                        // 显示 loading notification
                        dispatch(showLoadingNotification({
                            title: 'Loading LiveDoc View, please wait ',
                        }));

                        try {

                            const localParticipant = getLocalParticipant(getState());

                            let url = value;

                            if (ownerId === localParticipant?.id) {
                                url = url + `?token=${token}`;
                            } else {
                                // 从本地获取登录令牌
                                const localToken = localStorage.getItem('KloudUserToken');

                                if (localToken) {
                                    url = url + `?token=${localToken}`;
                                } else {
                                    const anonymousToken = await createOrUpdateInstantAccount(localParticipant?.name || '');

                                    url = url + `?token=${anonymousToken}`;
                                }
                            }

                            url = url + '&usetoken=1&fromjitsi=1';

                            // // If this is a new iframe or the URL changed, create a new participant
                            // if (!currentUrl || currentUrl !== url) {
                            //     dispatch(participantJoined({
                            //         conference,
                            //         fakeParticipant: FakeParticipant.SharedIframe,
                            //         id: url,
                            //         name: 'Shared Iframe'
                            //     }));

                            //     // Pin the iframe participant to the stage
                            //     dispatch(pinParticipant(url));
                            // }

                            dispatch(
                                setSharedIframeState({
                                    status,
                                    ownerId,
                                    url,
                                })
                            );

                            // 如果是新参会者接收到 livedoc 状态，自动显示
                            if (status === SHARED_IFRAME_STATUSES.START && ownerId !== localParticipant?.id) {
                                dispatch(setTileView(false)); // 关闭 tile view
                                dispatch(setSharedIframeActive(true)); // 显示 livedoc
                            }
                        } finally {
                            // dispatch(hideLoadingNotification());
                        }
                    }
        );
        break;
    }
    case CONFERENCE_LEFT: {
        dispatch(resetSharedIframeState());
        // dispatch(hideLoadingNotification());
        break;
    }
    case TRACK_ADDED:
    case TRACK_UPDATED:
    case TRACK_REMOVED: {
        // 检查屏幕共享状态变化
        const state = getState();
        const screenshareParticipantIds = getScreenshareParticipantIds(state);

        console.log('screenshareParticipantIds', screenshareParticipantIds);
        const { active: isLiveDocActive, wasActiveBeforeScreenshare } = state['features/shared-iframe'] || { active: false };

        // 如果有人开始屏幕共享且 LiveDoc 当前是显示状态，则隐藏 LiveDoc
        if (screenshareParticipantIds.length > 0 && isLiveDocActive) {
            // 保存当前状态，以便屏幕共享结束后恢复
            dispatch(setWasActiveBeforeScreenshare(true));
            dispatch(setSharedIframeActive(false));
        } else if (screenshareParticipantIds.length === 0 && wasActiveBeforeScreenshare) {
            // 如果屏幕共享停止且之前 LiveDoc 是显示状态，则恢复显示
            dispatch(setSharedIframeActive(true));
            dispatch(setWasActiveBeforeScreenshare(false));
        }
        break;
    }
    }

    return result;
});

