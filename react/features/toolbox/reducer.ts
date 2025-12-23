import ReducerRegistry from '../base/redux/ReducerRegistry';
import { set } from '../base/redux/functions';

import {
    CLEAR_CONFERENCE_INFO_TIMEOUT,
    CLEAR_TOOLBOX_TIMEOUT,
    FULL_SCREEN_CHANGED,
    SET_BUTTONS_WITH_NOTIFY_CLICK,
    SET_CONFERENCE_INFO_TIMEOUT,
    SET_CONFERENCE_INFO_VISIBLE,
    SET_HANGUP_MENU_VISIBLE,
    SET_MAIN_TOOLBAR_BUTTONS_THRESHOLDS,
    SET_OVERFLOW_DRAWER,
    SET_OVERFLOW_MENU_VISIBLE,
    SET_PARTICIPANT_MENU_BUTTONS_WITH_NOTIFY_CLICK,
    SET_TOOLBAR_BUTTONS,
    SET_TOOLBAR_HOVERED,
    SET_TOOLBOX_ENABLED,
    SET_TOOLBOX_MANUALLY_HIDDEN_TIMESTAMP,
    SET_TOOLBOX_SHIFT_UP,
    SET_TOOLBOX_TIMEOUT,
    SET_TOOLBOX_VISIBLE,
    TOGGLE_TOOLBOX_VISIBLE
} from './actionTypes';
import { NATIVE_THRESHOLDS, THRESHOLDS } from './constants';
import { IMainToolbarButtonThresholds, NOTIFY_CLICK_MODE } from './types';

/**
 * Array of thresholds for the main toolbar buttons that will inlude only the usable entries from  THRESHOLDS array.
 *
 * Note: THRESHOLDS array includes some dummy values that enables users of the iframe API to override and use.
 * Note2: Casting is needed because it seems isArray guard is not working well in TS. See:
 * https://github.com/microsoft/TypeScript/issues/17002.
 */
const FILTERED_THRESHOLDS = THRESHOLDS.filter(({ order }) => Array.isArray(order)) as IMainToolbarButtonThresholds;

/**
 * Initial state of toolbox's part of Redux store.
 */
const INITIAL_STATE = {
    buttonsWithNotifyClick: new Map(),

    /**
     * The indicator which determines whether the Toolbox is enabled.
     *
     * @type {boolean}
     */
    enabled: true,

    /**
     * The indicator which determines whether the hangup menu is visible.
     *
     * @type {boolean}
     */
    hangupMenuVisible: false,

    /**
     * The indicator which determines whether a Toolbar in the Toolbox is
     * hovered.
     *
     * @type {boolean}
     */
    hovered: false,

    /**
     * The thresholds for screen size and visible main toolbar buttons.
     */
    mainToolbarButtonsThresholds: navigator.product === 'ReactNative' ? NATIVE_THRESHOLDS : FILTERED_THRESHOLDS,

    participantMenuButtonsWithNotifyClick: new Map(),

    /**
     * The indicator which determines whether the overflow menu(s) are to be displayed as drawers.
     *
     * @type {boolean}
     */
    overflowDrawer: false,

    /**
     * The indicator which determines whether the OverflowMenu is visible.
     *
     * @type {boolean}
     */
    overflowMenuVisible: false,

    /**
     * Whether to shift the toolbar up (in case it overlaps the tiles names).
     */
    shiftUp: false,

    /**
     * A number, non-zero value which identifies the timer created by a call
     * to setTimeout().
     *
     * @type {number|null}
     */
    timeoutID: null,

    /**
     * The list of enabled toolbar buttons.
     *
     * @type {Array<string>}
     */
    toolbarButtons: [],


    /**
     * The timestamp when toolbox was manually hidden (via toggle button).
     *
     * @type {number|null}
     */
    manuallyHiddenTimestamp: null,

    /**
     * The indicator that determines whether the Toolbox is visible.
     *
     * @type {boolean}
     */
    visible: false,

    /**
     * The indicator that determines whether the ConferenceInfo is visible.
     *
     * @type {boolean}
     */
    conferenceInfoVisible: false,

    /**
     * A number, non-zero value which identifies the timer created by a call
     * to setTimeout() for ConferenceInfo visibility.
     *
     * @type {number|null}
     */
    conferenceInfoTimeoutID: null
};

export interface IToolboxState {
    buttonsWithNotifyClick: Map<string, NOTIFY_CLICK_MODE>;
    conferenceInfoTimeoutID?: number | null;
    conferenceInfoVisible: boolean;
    enabled: boolean;
    fullScreen?: boolean;
    hangupMenuVisible: boolean;
    hovered: boolean;
    mainToolbarButtonsThresholds: IMainToolbarButtonThresholds;
    manuallyHiddenTimestamp?: number | null;
    overflowDrawer: boolean;
    overflowMenuVisible: boolean;
    participantMenuButtonsWithNotifyClick: Map<string, NOTIFY_CLICK_MODE>;
    shiftUp: boolean;
    timeoutID?: number | null;
    toolbarButtons: Array<string>;
    visible: boolean;
}

ReducerRegistry.register<IToolboxState>(
    'features/toolbox',
    (state = INITIAL_STATE, action): IToolboxState => {
        switch (action.type) {
        case CLEAR_TOOLBOX_TIMEOUT:
            return {
                ...state,
                timeoutID: undefined
            };

        case FULL_SCREEN_CHANGED:
            return {
                ...state,
                fullScreen: action.fullScreen
            };

        case SET_HANGUP_MENU_VISIBLE:
            return {
                ...state,
                hangupMenuVisible: action.visible
            };

        case SET_OVERFLOW_DRAWER:
            return {
                ...state,
                overflowDrawer: action.displayAsDrawer
            };

        case SET_OVERFLOW_MENU_VISIBLE:
            return {
                ...state,
                overflowMenuVisible: action.visible
            };

        case SET_TOOLBAR_BUTTONS:
            return {
                ...state,
                toolbarButtons: action.toolbarButtons
            };
        case SET_BUTTONS_WITH_NOTIFY_CLICK:
            return {
                ...state,
                buttonsWithNotifyClick: action.buttonsWithNotifyClick
            };

        case SET_MAIN_TOOLBAR_BUTTONS_THRESHOLDS:
            return {
                ...state,
                mainToolbarButtonsThresholds: action.mainToolbarButtonsThresholds
            };
        case SET_TOOLBAR_HOVERED:
            return {
                ...state,
                hovered: action.hovered
            };

        case SET_TOOLBOX_ENABLED:
            return {
                ...state,
                enabled: action.enabled
            };

        case SET_TOOLBOX_TIMEOUT:
            return {
                ...state,
                timeoutID: action.timeoutID
            };

        case SET_TOOLBOX_SHIFT_UP:
            return {
                ...state,
                shiftUp: action.shiftUp
            };

        case SET_TOOLBOX_VISIBLE:
            return set(state, 'visible', action.visible);

        case SET_PARTICIPANT_MENU_BUTTONS_WITH_NOTIFY_CLICK:
            return {
                ...state,
                participantMenuButtonsWithNotifyClick: action.participantMenuButtonsWithNotifyClick
            };

        case SET_TOOLBOX_MANUALLY_HIDDEN_TIMESTAMP:
            return set(state, 'manuallyHiddenTimestamp', action.timestamp);

        case TOGGLE_TOOLBOX_VISIBLE:
            return set(state, 'visible', !state.visible);

        case SET_CONFERENCE_INFO_VISIBLE:
            return set(state, 'conferenceInfoVisible', action.visible);

        case CLEAR_CONFERENCE_INFO_TIMEOUT:
            return {
                ...state,
                conferenceInfoTimeoutID: undefined
            };

        case SET_CONFERENCE_INFO_TIMEOUT:
            return {
                ...state,
                conferenceInfoTimeoutID: action.timeoutID
            };
        }

        return state;
    });
