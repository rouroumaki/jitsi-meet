import { CONFERENCE_JOINED, CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT, UPDATE_CONFERENCE_METADATA } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { PARTICIPANT_JOINED } from '../base/participants/actionTypes';
import { participantJoined, pinParticipant } from '../base/participants/actions';
import { getLocalParticipant, isLocalParticipantModerator } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { getLargeVideoParticipant } from '../large-video/functions';
import { hideLoadingNotification, showLoadingNotification } from '../notifications/actions';

import { resetSharedIframeState, setSharedIframeActive, setSharedIframeState } from './actions';
import { checkIfLivesyncCall } from './apiFunctions';
import { LIVEDOC_METADATA_KEY, SHARED_IFRAME, SHARED_IFRAME_STATUSES } from './constants';
import { createLivedocInstance, createOrUpdateInstantAccount, sendSharedIframeCommand } from './functions';

MiddlewareRegistry.register(store => next => action => {
    const result = next(action);
    const { dispatch, getState } = store;

    switch (action.type) {
    case CONFERENCE_JOINED: {
        const { conference } = action;
        const state = getState();
        const localParticipant = getLocalParticipant(state);

        // 检查是否已存在 livedoc instanceId
        const existingMetadata = conference?.getMetadataHandler().getMetadata();
        const existingLivedocInstanceId = existingMetadata?.livedoc?.instanceId;

        if (!existingLivedocInstanceId) {
            // 第一个参与者，检查是否是 livesyncCall 模式
            (async () => {
                try {
                    // 获取 roomName
                    const roomName = conference?.getName();

                    if (!roomName) {
                        console.warn('Room name not available');

                        return;
                    }

                    // 检查是否是 livesyncCall 模式
                    const isLivesyncCall = await checkIfLivesyncCall(roomName);

                    if (isLivesyncCall) {
                        // livesyncCall 模式：使用 roomName 作为 instanceId，立即开启 livedoc iframe
                        // 获取或创建用户 token
                        let localToken = localStorage.getItem('KloudUserToken');

                        if (!localToken) {
                            localToken = await createOrUpdateInstantAccount(localParticipant?.name || '');
                        }

                        // 保存到 conference metadata（type = livesyncCall, instanceId = roomName）
                        conference?.getMetadataHandler().setMetadata(LIVEDOC_METADATA_KEY, {
                            type: 'livesyncCall',
                            instanceId: roomName
                        });

                        // 更新到 Redux state
                        dispatch(setSharedIframeState({
                            livedocInstanceId: roomName,
                        }));

                        // 构建 URL
                        const url = `https://kloud.cn/GoogleMeet/MainStage/${roomName}/0?token=${localToken}&usetoken=1&fromjitsi=1`;

                        // 添加 livedoc 参与者
                        dispatch(participantJoined({
                            conference,
                            fakeParticipant: FakeParticipant.SharedIframe,
                            id: 'livedoc',
                            name: 'Shared Iframe'
                        }));

                        // 更新 Redux state 的 url 和 status
                        dispatch(setSharedIframeState({
                            status: SHARED_IFRAME_STATUSES.START,
                            ownerId: localParticipant?.id,
                            url,
                        }));

                        // 发送命令通知其他人开启 livedoc iframe
                        sendSharedIframeCommand({
                            conference,
                            localParticipantId: localParticipant?.id,
                            status: SHARED_IFRAME_STATUSES.START,
                            url: `https://kloud.cn/GoogleMeet/MainStage/${roomName}/0`,
                            token: localToken || '',
                            isShow: true,
                        });

                        // 显示 iframe
                        dispatch(pinParticipant('livedoc'));
                        dispatch(setSharedIframeActive(true));
                    } else {
                        // 普通模式：创建 livedoc 实例
                        // 获取或创建用户 token
                        let localToken = localStorage.getItem('KloudUserToken');

                        if (!localToken) {
                            localToken = await createOrUpdateInstantAccount(localParticipant?.name || '');
                        }

                        // 生成 UUID 作为会议的唯一标识符
                        const jitsiInstanceId = crypto.randomUUID();

                        const livedocInstanceId = await createLivedocInstance({
                            userToken: localToken || '',
                            jitsiInstanceId
                        });

                        // 保存到 conference metadata（同时保存 instanceId 与用于追踪的 jitsiInstanceId/UUID）
                        conference?.getMetadataHandler().setMetadata(LIVEDOC_METADATA_KEY, {
                            instanceId: livedocInstanceId,
                            jitsiInstanceId
                        });

                        // 更新到 Redux state
                        dispatch(setSharedIframeState({
                            livedocInstanceId,
                        }));
                    }
                } catch (error) {
                    console.error('Failed to initialize livedoc:', error);
                }
            })();
        } else {
            // 已存在，直接更新到 Redux state
            dispatch(setSharedIframeState({
                livedocInstanceId: existingLivedocInstanceId,
                status: SHARED_IFRAME_STATUSES.START
            }));
        }
        break;
    }
    case UPDATE_CONFERENCE_METADATA: {
        const { metadata } = action;
        const livedocMetadata = metadata?.livedoc;
        const livedocInstanceId = livedocMetadata?.instanceId;
        const livedocType = livedocMetadata?.type;

        if (livedocInstanceId) {
            // 如果是 livesyncCall 类型，需要自动开启 iframe
            if (livedocType === 'livesyncCall') {
                (async () => {
                    try {
                        const state = getState();
                        const localParticipant = getLocalParticipant(state);
                        const conference = getCurrentConference(state);

                        if (!conference || !localParticipant) {
                            return;
                        }

                        // 获取或创建用户 token
                        let localToken = localStorage.getItem('KloudUserToken');

                        if (!localToken) {
                            localToken = await createOrUpdateInstantAccount(localParticipant?.name || '');
                        }

                        // 构建 URL
                        const url = `https://kloud.cn/GoogleMeet/MainStage/${livedocInstanceId}/0?token=${localToken}&usetoken=1&fromjitsi=1`;

                        // 添加 livedoc 参与者
                        dispatch(participantJoined({
                            conference,
                            fakeParticipant: FakeParticipant.SharedIframe,
                            id: 'livedoc',
                            name: 'Shared Iframe'
                        }));

                        // 更新 Redux state
                        dispatch(setSharedIframeState({
                            livedocInstanceId,
                            status: SHARED_IFRAME_STATUSES.START,
                            ownerId: localParticipant?.id,
                            url,
                        }));

                        // 显示 iframe
                        dispatch(pinParticipant('livedoc'));
                        dispatch(setSharedIframeActive(true));
                    } catch (error) {
                        console.error('Failed to start livesyncCall iframe:', error);
                    }
                })();
            } else {
                // 普通模式，只更新 livedocInstanceId
                dispatch(setSharedIframeState({
                    livedocInstanceId,
                    status: SHARED_IFRAME_STATUSES.START
                }));
            }
        }
        break;
    }
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
                        const { url: _currentUrl, active: _active, isScreenShared } = state['features/shared-iframe'] || {};

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
                            // 这里加延迟是为了pinParticipant livedoc能最后一个触发
                            setTimeout(() => {
                                dispatch(pinParticipant('livedoc'));
                            }, 300);
                            dispatch(setSharedIframeActive(true));
                        }

                        if (status === SHARED_IFRAME_STATUSES.HIDE) {
                            dispatch(setSharedIframeActive(false));

                            return;
                        }

                        if (_currentUrl) {
                            return;
                        }

                        try {
                            // 显示 loading notification
                            !isScreenShared && dispatch(showLoadingNotification({
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


                            dispatch(
                                setSharedIframeState({
                                    status,
                                    ownerId,
                                    url,
                                })
                            );

                            if (status === SHARED_IFRAME_STATUSES.START && isShow) {
                                dispatch(pinParticipant('livedoc'));
                                dispatch(setSharedIframeActive(true));
                            }
                        } catch {
                            dispatch(hideLoadingNotification());
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

