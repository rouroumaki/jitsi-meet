import { CONFERENCE_JOIN_IN_PROGRESS, CONFERENCE_LEFT } from "../base/conference/actionTypes";
import { getCurrentConference } from "../base/conference/functions";
import { getLocalParticipant } from "../base/participants/functions";
import MiddlewareRegistry from "../base/redux/MiddlewareRegistry";

import { resetSharedIframeState, setSharedIframeState } from "./actions";
import { SHARED_IFRAME, SHARED_IFRAME_STATUSES } from "./constants";

MiddlewareRegistry.register((store) => (next) => (action) => {
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
                    value: string;
                    attributes: { from: string; state: string; token: string };
                }) => {
                    const ownerId = attributes.from;
                    const status = attributes.state;
                    const token = attributes.token;

                    if (status === SHARED_IFRAME_STATUSES.STOP) {
                        dispatch(resetSharedIframeState());
                        return;
                    }

                    const localParticipant = getLocalParticipant(getState());

                    let url = value;

                    if (ownerId === localParticipant?.id) {
                        url = url + `?token=${token}`;
                    } else {
                        // 从本地获取登录令牌
                        const localToken = localStorage.getItem("KloudUserToken");
                        if (localToken) {
                            url = url + `?token=${localToken}`;
                        }
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

function safeParse(s?: string) {
    if (!s) {
        return undefined;
    }
    try {
        return JSON.parse(s);
    } catch (_e) {
        return undefined;
    }
}
