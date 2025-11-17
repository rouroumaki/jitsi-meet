/**
 * Type of action which sets the current state of STT.
 *
 * {
 *     type: SET_STT_ENABLED,
 *     enabled: boolean
 * }
 */
export const SET_STT_ENABLED = 'SET_STT_ENABLED';

/**
 * Type of action which updates the local subtitle display.
 *
 * {
 *     type: UPDATE_LOCAL_SUBTITLE,
 *     participantName: string,
 *     text: string,
 *     isInterim: boolean
 * }
 */
export const UPDATE_LOCAL_SUBTITLE = 'UPDATE_LOCAL_SUBTITLE';

/**
 * Type of action which sets the subtitle visibility.
 *
 * {
 *     type: SET_SUBTITLE_VISIBLE,
 *     visible: boolean
 * }
 */
export const SET_SUBTITLE_VISIBLE = 'SET_SUBTITLE_VISIBLE';

/**
 * Type of action which receives a remote subtitle.
 *
 * {
 *     type: RECEIVE_REMOTE_SUBTITLE,
 *     participantName: string,
 *     text: string,
 *     isInterim: boolean
 * }
 */
export const RECEIVE_REMOTE_SUBTITLE = 'RECEIVE_REMOTE_SUBTITLE';

/**
 * Type of action which receives STT status change from moderator.
 *
 * {
 *     type: RECEIVE_STT_STATUS_CHANGED,
 *     enabled: boolean
 * }
 */
export const RECEIVE_STT_STATUS_CHANGED = 'RECEIVE_STT_STATUS_CHANGED';

/**
 * Type of action which clears the current subtitle.
 *
 * {
 *     type: CLEAR_SUBTITLE
 * }
 */
export const CLEAR_SUBTITLE = 'CLEAR_SUBTITLE';

