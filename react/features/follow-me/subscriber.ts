import { IReduxState, IStore } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import {
    getPinnedParticipant,
    isLocalParticipantModerator
} from '../base/participants/functions';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { getPinnedActiveParticipants, isStageFilmstripEnabled } from '../filmstrip/functions.web';
import { shouldDisplayTileView } from '../video-layout/functions.web';

import { setFollowMeDebounceTimer, setFollowMeLastSendTime } from './actions';
import { FOLLOW_ME_COMMAND } from './constants';

/**
 * Subscribes to changes to the Follow Me setting for the local participant to
 * notify remote participants of current user interface status.
 * Changing newSelectedValue param to off, when feature is turned of so we can
 * notify all listeners.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/conference'].followMeEnabled,
    /* listener */ (newSelectedValue, store) => _sendFollowMeCommand(newSelectedValue || 'off', store));

/**
 * Subscribes to changes to the currently pinned participant in the user
 * interface of the local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => {
        const pinnedParticipant = getPinnedParticipant(state);

        // 排除 livedoc，避免 livedoc pin/unpin 触发 follow-me 命令
        if (pinnedParticipant && pinnedParticipant.id === 'livedoc') {
            return null;
        }

        return pinnedParticipant ? pinnedParticipant.id : null;
    },
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the shared document (etherpad) visibility in the
 * user interface of the local participant.
 *
 * @param sharedDocumentVisible - {Boolean} {true} If the shared document was
 * shown (as a result of the toggle) or {false} if it was hidden.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/etherpad'].editing,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the filmstrip visibility in the user interface of
 * the local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/filmstrip'].visible,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the stage filmstrip participants.
 */
StateListenerRegistry.register(
    /* selector */ getPinnedActiveParticipants,
    /* listener */ _sendFollowMeCommand,
    {
        deepEquals: true
    });

/**
 * Subscribes to changes to the tile view setting in the user interface of the
 * local participant.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/video-layout'].tileViewEnabled,
    /* listener */ _sendFollowMeCommand);

/**
 * Subscribes to changes to the max number of stage participants setting.
 */
StateListenerRegistry.register(
    /* selector */ state => state['features/base/settings'].maxStageParticipants,
    /* listener */ _sendFollowMeCommand);

/**
 * Private selector for returning state from redux that should be respected by
 * other participants while follow me is enabled.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function _getFollowMeState(state: IReduxState) {
    const pinnedParticipant = getPinnedParticipant(state);
    const stageFilmstrip = isStageFilmstripEnabled(state);

    return {
        recorder: state['features/base/conference'].followMeRecorderEnabled,
        filmstripVisible: state['features/filmstrip'].visible,
        maxStageParticipants: stageFilmstrip ? state['features/base/settings'].maxStageParticipants : undefined,
        nextOnStage: pinnedParticipant?.id,
        pinnedStageParticipants: stageFilmstrip ? JSON.stringify(getPinnedActiveParticipants(state)) : undefined,
        sharedDocumentVisible: state['features/etherpad'].editing,
        tileViewEnabled: shouldDisplayTileView(state)
    };
}

/**
 * Sends the follow-me command, when a local property change occurs.
 *
 * @param {*} newSelectedValue - The changed selected value from the selector.
 * @param {Object} store - The redux store.
 * @private
 * @returns {void}
 */
function _sendFollowMeCommand(
        newSelectedValue: any, store: IStore) {
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    // Only a moderator is allowed to send commands.
    if (!isLocalParticipantModerator(state)) {
        return;
    }

    // 【关键】真正的防抖机制：1秒内多次触发只执行最后一次
    const debounceDelay = 500; // 1秒防抖延迟
    const currentTimer = state['features/follow-me'].debounceTimer;

    // 清除之前的定时器
    if (currentTimer) {
        clearTimeout(currentTimer);
    }

    // 设置新的定时器，延迟执行
    const timer = setTimeout(() => {
        _executeFollowMeCommand(newSelectedValue, store);
    }, debounceDelay);

    // 保存定时器ID
    store.dispatch(setFollowMeDebounceTimer(timer as any));

    return;
}

/**
 * 实际执行 follow-me 命令的函数（防抖延迟执行）.
 *
 * @param {any} newSelectedValue - The changed selected value from the selector.
 * @param {IStore} store - The redux store.
 * @returns {void}
 */
function _executeFollowMeCommand(newSelectedValue: any, store: IStore) {
    const state = store.getState();
    const conference = getCurrentConference(state);

    if (!conference) {
        return;
    }

    if (newSelectedValue === 'off') {
        conference.sendCommandOnce(
            FOLLOW_ME_COMMAND,
            { attributes: { off: true } }
        );

        return;
    }

    // 主持人自动发送视图同步命令
    conference.sendCommand(
        FOLLOW_ME_COMMAND,
        { attributes: _getFollowMeState(state) }
    );

    // 记录发送时间
    store.dispatch(setFollowMeLastSendTime(Date.now()));
}
