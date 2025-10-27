import { CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import { participantJoined, pinParticipant } from '../base/participants/actions';
import { getLocalParticipant, isLocalParticipantModerator } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getLargeVideoParticipant } from '../large-video/functions';
import { showLoadingNotification } from '../notifications/actions';

import { resetSharedIframeState, setSharedIframeActive, setSharedIframeState } from './actions';
import { SHARED_IFRAME, SHARED_IFRAME_STATUSES } from './constants';
import { createOrUpdateInstantAccount, sendSharedIframeCommand } from './functions';

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
                        attributes: { from: string; isShow?: string; state: string; token: string; };
                        value: string;
                    }) => {
                        const ownerId = attributes.from;
                        const status = attributes.state;
                        const token = attributes.token;
                        const isShow = attributes.isShow !== undefined ? attributes.isShow === 'true' : true;
                        const state = getState();
                        const { url: _currentUrl, active: _active } = state['features/shared-iframe'] || {};

                        if (status === SHARED_IFRAME_STATUSES.STOP) {
                            // Remove the iframe participant when stopping
                            // dispatch(participantLeft(currentUrl ?? '', conference, {
                            //     fakeParticipant: FakeParticipant.SharedIframe
                            // }));
                            dispatch(setSharedIframeActive(false));
                            dispatch(resetSharedIframeState());

                            return;
                        }

                        // 处理视图显示/隐藏状态
                        if (status === SHARED_IFRAME_STATUSES.SHOW) {
                            console.log('status === SHARED_IFRAME_STATUSES.SHOW', _active);
                            // dispatch(setTileView(false)); // 关闭 tile view
                            dispatch(pinParticipant('livedoc'));
                            dispatch(setSharedIframeActive(true));
                        }

                        if (status === SHARED_IFRAME_STATUSES.HIDE) {
                            // 隐藏 LiveDoc 视图 - 通过 unpin 来隐藏
                            // dispatch(unpinParticipant('livedoc'));
                            dispatch(setSharedIframeActive(false));

                            return;
                        }

                        if (_currentUrl) {
                            return;
                        }

                        try {
                            // 显示 loading notification
                            dispatch(showLoadingNotification({
                                title: 'Loading LiveDoc View, please wait ',
                            }));

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

                            dispatch(participantJoined({
                                conference,
                                fakeParticipant: FakeParticipant.SharedIframe,
                                id: 'livedoc',
                                name: 'Shared Iframe'
                            }));

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

                            if (status === SHARED_IFRAME_STATUSES.START && isShow) {
                                // dispatch(setTileView(false)); // 关闭 tile view
                                dispatch(pinParticipant('livedoc'));
                                dispatch(setSharedIframeActive(true));
                            }
                        } finally {
                            // dispatch(hideLoadingNotification());
                        }
                    }
        );
        break;
    }
    case CONFERENCE_LEFT: {
        dispatch(setSharedIframeActive(false));
        dispatch(resetSharedIframeState());
        // dispatch(hideLoadingNotification());
        break;
    }
    case PARTICIPANT_JOINED: {
        // 当新参会者加入时，如果livedoc处于活跃状态且当前用户是主持人，重新发送livedoc状态
        const { participant } = action;

        // 只处理真实的参会者，跳过fake participants
        if (participant?.fakeParticipant) {
            break;
        }

        const state = getState();
        const { url, ownerId } = state['features/shared-iframe'] || {};
        const localParticipant = getLocalParticipant(state);
        const conference = getCurrentConference(state);
        const isShow = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;

        // 只有主持人且livedoc处于START状态时才重新发送（通过url和ownerId判断）
        if (isLocalParticipantModerator(state) && url && ownerId && conference) {
            // 获取token
            const localToken = localStorage.getItem('KloudUserToken');

            // 重新发送livedoc状态给新参会者
            sendSharedIframeCommand({
                conference,
                localParticipantId: localParticipant?.id,
                status: SHARED_IFRAME_STATUSES.START,
                url: url.split('?')[0], // 去掉URL中的参数
                token: localToken || '',
                isShow: isShow,
            });
        }
        break;
    }
    // case TRACK_ADDED:
    // case TRACK_UPDATED:
    // case TRACK_REMOVED: {
    //     // 检查屏幕共享状态变化
    //     const state = getState();
    //     const screenshareParticipantIds = getScreenshareParticipantIds(state);
    //     const largeVideoParticipant = getLargeVideoParticipant(state);
    //     const isLiveDocOnStage = largeVideoParticipant?.fakeParticipant === FakeParticipant.SharedIframe;
    //     const { wasActiveBeforeScreenshare } = state['features/shared-iframe'] || { wasActiveBeforeScreenshare: false };

    //     // 如果有人开始屏幕共享且 LiveDoc 当前在舞台上，则隐藏 LiveDoc
    //     if (screenshareParticipantIds.length > 0 && isLiveDocOnStage) {
    //         // 保存当前状态，以便屏幕共享结束后恢复
    //         dispatch(setWasActiveBeforeScreenshare(true));
    //         // 通过 unpin 来隐藏 LiveDoc
    //         // dispatch(unpinParticipant('livedoc'));
    //     } else if (screenshareParticipantIds.length === 0 && wasActiveBeforeScreenshare) {
    //         // 如果屏幕共享停止且之前 LiveDoc 是显示状态，则恢复显示
    //         dispatch(pinParticipant('livedoc'));
    //         dispatch(setWasActiveBeforeScreenshare(false));
    //     }
    //     break;
    // }
    }

    return result;
});

