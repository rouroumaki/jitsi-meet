import { CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT } from '../base/conference/actionTypes';
import { participantJoined, participantLeft, pinParticipant } from '../base/participants/actions';
import { getLocalParticipant } from '../base/participants/functions';
import { FakeParticipant } from '../base/participants/types';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { resetSharedIframeState, setSharedIframeState } from './actions';
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
                        const { url: currentUrl } = state['features/shared-iframe'] || {};

                        if (status === SHARED_IFRAME_STATUSES.STOP) {
                            // Remove the iframe participant when stopping
                            dispatch(participantLeft(currentUrl ?? '', conference, {
                                fakeParticipant: FakeParticipant.SharedIframe
                            }));
                            dispatch(resetSharedIframeState());

                            return;
                        }

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

                        // If this is a new iframe or the URL changed, create a new participant
                        if (!currentUrl || currentUrl !== url) {
                            dispatch(participantJoined({
                                conference,
                                fakeParticipant: FakeParticipant.SharedIframe,
                                id: url,
                                name: 'Shared Iframe'
                            }));

                            // Pin the iframe participant to the stage
                            dispatch(pinParticipant(url));
                        }

                        dispatch(
                            setSharedIframeState({
                                status,
                                ownerId,
                                url,
                            })
                        );
                    }
        );
        break;
    }
    case CONFERENCE_LEFT: {
        dispatch(resetSharedIframeState());
        break;
    }
    }

    return result;
});

