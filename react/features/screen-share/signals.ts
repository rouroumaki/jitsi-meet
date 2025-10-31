import { IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getParticipantById } from '../base/participants/functions';
import { showNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

const FORCE_STOP_SCREENSHARE = 'force-stop-screenshare';

export function sendForceStopScreenShare(targetParticipantId: string) {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();
        const conference = getCurrentConference(state);
        const local = getLocalParticipant(state);
        const target = getParticipantById(state, targetParticipantId);

        if (conference && targetParticipantId) {
            try {
                conference.sendEndpointMessage(targetParticipantId, {
                    name: FORCE_STOP_SCREENSHARE,
                    by: local?.id,
                    byName: local?.name
                });

                if (target) {
                    dispatch(showNotification({
                        titleKey: 'screenshare.youInterrupted',
                        titleArguments: { name: target.name || '' }
                    }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
                }
            } catch (e) {
                // ignore send failures for now
            }
        }
    };
}

export { FORCE_STOP_SCREENSHARE };
