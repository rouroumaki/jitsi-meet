/**
 * The id of the Follow Me moderator.
 *
 * {
 *     type: SET_FOLLOW_ME_MODERATOR,
 *     id: boolean
 * }
 */
export const SET_FOLLOW_ME_MODERATOR = 'SET_FOLLOW_ME_MODERATOR';

/**
 * The type of (redux) action which updates the current known state of the
 * Follow Me feature.
 *
 *
 * {
 *     type: SET_FOLLOW_ME_STATE,
 *     state: boolean
 * }
 */
export const SET_FOLLOW_ME_STATE = 'SET_FOLLOW_ME_STATE';

/**
 * The type of (redux) action which sets the last send time for follow-me commands.
 *
 * {
 *     type: SET_FOLLOW_ME_LAST_SEND_TIME,
 *     lastSendTime: number
 * }
 */
export const SET_FOLLOW_ME_LAST_SEND_TIME = 'SET_FOLLOW_ME_LAST_SEND_TIME';

/**
 * The type of (redux) action which sets the debounce timer for follow-me commands.
 *
 * {
 *     type: SET_FOLLOW_ME_DEBOUNCE_TIMER,
 *     timer: number
 * }
 */
export const SET_FOLLOW_ME_DEBOUNCE_TIMER = 'SET_FOLLOW_ME_DEBOUNCE_TIMER';
