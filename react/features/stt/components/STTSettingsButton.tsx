import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { IconGear } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions.web';

import STTSettingsDialog from './STTSettingsDialog';

interface IProps extends AbstractButtonProps {
}

/**
 * Component that renders a button for opening STT settings dialog.
 */
class STTSettingsButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sttSettings';
    override icon = IconGear;
    override label = 'toolbar.accessibilityLabel.sttSettings';
    override tooltip = 'toolbar.accessibilityLabel.sttSettings';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        dispatch(openDialog(STTSettingsDialog));
        dispatch(setOverflowMenuVisible(false));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        visible: true // Visible to all users
    };
}

export default translate(connect(_mapStateToProps)(STTSettingsButton));

