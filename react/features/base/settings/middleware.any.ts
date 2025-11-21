import { escape } from 'lodash-es';
import { AnyAction } from 'redux';

import { IStore } from '../../app/types';
import { getUserLoginInfo } from '../../shared-iframe/apiFunctions';
import { SET_LOCATION_URL } from '../connection/actionTypes';
import { participantUpdated } from '../participants/actions';
import { getLocalParticipant } from '../participants/functions';
import MiddlewareRegistry from '../redux/MiddlewareRegistry';
import { parseURLParams } from '../util/parseURLParams';

import { SETTINGS_UPDATED } from './actionTypes';
import { updateSettings } from './actions';

/**
 * The middleware of the feature base/settings. Distributes changes to the state
 * of base/settings to the states of other features computed from the state of
 * base/settings.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    const result = next(action);

    switch (action.type) {
    case SETTINGS_UPDATED:
        _updateLocalParticipant(store, action);
        break;
    case SET_LOCATION_URL:
        _updateLocalParticipantFromUrl(store);
        _handleTokenAutoLogin(store);
        break;
    }

    return result;
});

/**
 * Maps the settings field names to participant names where they don't match.
 * Currently there is only one such field, but may be extended in the future.
 *
 * @private
 * @param {string} settingsField - The name of the settings field to map.
 * @returns {string}
 */
function _mapSettingsFieldToParticipant(settingsField: string) {
    switch (settingsField) {
    case 'displayName':
        return 'name';
    }

    return settingsField;
}

/**
 * Updates the local participant according to settings changes.
 *
 * @param {Store} store - The redux store.
 * @param {Object} action - The dispatched action.
 * @private
 * @returns {void}
 */
function _updateLocalParticipant({ dispatch, getState }: IStore, action: AnyAction) {
    const { settings } = action;
    const localParticipant = getLocalParticipant(getState());
    const newLocalParticipant = {
        ...localParticipant
    };

    for (const key in settings) {
        if (settings.hasOwnProperty(key)) {
            newLocalParticipant[_mapSettingsFieldToParticipant(key) as keyof typeof newLocalParticipant]
                = settings[key];
        }
    }

    dispatch(participantUpdated({
        ...newLocalParticipant,
        id: newLocalParticipant.id ?? ''
    }));
}


/**
 * Returns the userInfo set in the URL.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
function _updateLocalParticipantFromUrl({ dispatch, getState }: IStore) {
    const urlParams
        = parseURLParams(getState()['features/base/connection'].locationURL ?? '');
    const urlEmail = urlParams['userInfo.email'];
    const urlDisplayName = urlParams['userInfo.displayName'];

    if (!urlEmail && !urlDisplayName) {
        return;
    }

    const localParticipant = getLocalParticipant(getState());

    if (localParticipant) {
        const displayName = escape(urlDisplayName);
        const email = escape(urlEmail);

        dispatch(participantUpdated({
            ...localParticipant,
            email,
            name: displayName
        }));

        dispatch(updateSettings({
            displayName,
            email
        }));
    }
}

/**
 * Handles automatic login with token from URL parameters.
 * If token is present in URL, calls API to get user info and sets up kloud login.
 *
 * @param {Store} store - The redux store.
 * @private
 * @returns {void}
 */
async function _handleTokenAutoLogin({ dispatch, getState }: IStore) {
    const locationURL = getState()['features/base/connection'].locationURL;

    if (!locationURL) {
        return;
    }

    // 直接从URL的searchParams中获取token，避免parseURLParams的JSON解析问题
    const token = locationURL.searchParams?.get('token');

    if (!token || typeof token !== 'string') {
        return;
    }

    window.localStorage.setItem('KloudUserToken', token);

    // 避免重复调用，如果已经有相同的token在localStorage中，跳过
    const existingToken = typeof window !== 'undefined' ? window.localStorage.getItem('KloudUserToken') : null;

    // if (existingToken === token) {
    //     return;
    // }

    try {
        const userInfo = await getUserLoginInfo(token);
        const userName = userInfo.Name;
        const classRoomID = userInfo.ClassRoomID;

        if (classRoomID) {
            window.localStorage.setItem('KloudClassRoomID', classRoomID);
            dispatch(updateSettings({
                classRoomID
            }));
        }

        if (userName && typeof window !== 'undefined') {
            window.localStorage.setItem('KloudUserName', userName);

            // 设置displayName为kloud用户名
            dispatch(updateSettings({
                displayName: userName,
            }));

            // 触发kloud-login-updated事件
            window.dispatchEvent(new CustomEvent('kloud-login-updated'));
        }
    } catch (error) {
        // 静默处理错误，避免影响正常流程
        console.warn('Failed to auto login with token:', error);
    }
}
