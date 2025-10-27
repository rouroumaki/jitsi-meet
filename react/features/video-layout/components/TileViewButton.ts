import { batch, connect } from 'react-redux';

import { createToolbarEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState } from '../../app/types';
import { TILE_VIEW_ENABLED } from '../../base/flags/constants';
import { getFeatureFlag } from '../../base/flags/functions';
import { translate } from '../../base/i18n/functions';
import { IconTileView } from '../../base/icons/svg';
import { pinParticipant } from '../../base/participants/actions';
import { isLocalParticipantModerator } from '../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { showWarningNotification } from '../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../notifications/constants';
import { setOverflowMenuVisible } from '../../toolbox/actions.web';
import { setTileView } from '../actions.any';
import { shouldDisplayTileView } from '../functions.any';
import logger from '../logger';

/**
 * The type of the React {@code Component} props of {@link TileViewButton}.
 */
interface IProps extends AbstractButtonProps {

    /**
     * The Redux state.
     */
    _reduxState: IReduxState;

    /**
     * Whether or not tile view layout has been enabled as the user preference.
     */
    _tileViewEnabled: boolean;
}

/**
 * Component that renders a toolbar button for toggling the tile layout view.
 *
 * @augments AbstractButton
 */
class TileViewButton<P extends IProps> extends AbstractButton<P> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.enterTileView';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.exitTileView';
    override icon = IconTileView;
    override label = 'toolbar.enterTileView';
    override toggledLabel = 'toolbar.exitTileView';
    override tooltip = 'toolbar.tileViewToggle';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { _tileViewEnabled, dispatch, _reduxState } = this.props;

        // 只有主持人才能切换 Tile View
        if (!isLocalParticipantModerator(_reduxState)) {
            dispatch(showWarningNotification({
                titleKey: 'notify.moderatorOnlyViewChange'
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            return;
        }

        const value = !_tileViewEnabled;

        sendAnalytics(createToolbarEvent(
            'tileview.button',
            {
                'is_enabled': value
            }));

        logger.debug(`Tile view ${value ? 'enable' : 'disable'}`);
        batch(() => {
            dispatch(setTileView(value));
            navigator.product !== 'ReactNative' && dispatch(setOverflowMenuVisible(false));
        });

    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._tileViewEnabled;
    }
}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code TileViewButton} component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The properties explicitly passed to the component instance.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const enabled = getFeatureFlag(state, TILE_VIEW_ENABLED, true);
    const { visible = enabled } = ownProps;

    return {
        _tileViewEnabled: shouldDisplayTileView(state),
        _reduxState: state,
        visible
    };
}

export default translate(connect(_mapStateToProps)(TileViewButton));
