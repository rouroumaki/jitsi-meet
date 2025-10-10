import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { hideNotification } from '../../actions';
import { LOADING_NOTIFICATION_ID } from '../../constants';
import { areThereNotifications } from '../../functions';
import { INotificationProps } from '../../types';

import LoadingNotification from './LoadingNotification';

interface IProps {

    /**
     * Whether we are a SIP gateway or not.
     */
    _iAmSipGateway: boolean;

    /**
     * The loading notification to be displayed.
     */
    _loadingNotification?: {
        props: INotificationProps;
        uid: string;
    };

    /**
     * Invoked to update the redux store in order to remove notifications.
     */
    dispatch: IStore['dispatch'];
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            position: 'absolute',
            left: '16px',
            top: '16px',
            width: '320px',
            maxWidth: 'calc(100% - 32px)',
            zIndex: 600
        }
    };
});

const LoadingNotificationContainer = ({
    _iAmSipGateway,
    _loadingNotification,
    dispatch
}: IProps) => {
    const { classes } = useStyles();

    const _onDismissed = useCallback((uid: string) => {
        dispatch(hideNotification(uid));
    }, [ dispatch ]);

    if (_iAmSipGateway || !_loadingNotification) {
        return null;
    }

    return (
        <div
            className = { classes.container }
            id = 'loading-notification-container'>
            <LoadingNotification
                { ..._loadingNotification.props }
                onDismissed = { _onDismissed }
                uid = { _loadingNotification.uid } />
        </div>
    );
};

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const { notifications } = state['features/notifications'];
    const { iAmSipGateway } = state['features/base/config'];
    const _visible = areThereNotifications(state);

    // Find the loading notification specifically
    const loadingNotification = _visible 
        ? notifications.find(n => n.uid === LOADING_NOTIFICATION_ID)
        : undefined;

    return {
        _iAmSipGateway: Boolean(iAmSipGateway),
        _loadingNotification: loadingNotification
    };
}

export default connect(_mapStateToProps)(LoadingNotificationContainer);
