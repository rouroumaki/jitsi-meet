import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconSubtitles } from '../../base/icons/svg';
import { isLocalParticipantModerator } from '../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions.web';
import { setSTTEnabled } from '../actions';
import { isSTTEnabled } from '../functions';

interface IProps extends AbstractButtonProps {
    _isModerator?: boolean;
    _isSTTEnabled?: boolean;
}

/**
 * Component that renders a button for enabling/disabling STT (moderator only).
 */
class STTButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sttEnable';
    override icon = IconSubtitles;
    override label = 'toolbar.accessibilityLabel.sttEnable';
    override tooltip = 'toolbar.accessibilityLabel.sttEnable';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.sttDisable';
    override toggledLabel = 'toolbar.accessibilityLabel.sttDisable';
    override toggledTooltip = 'toolbar.accessibilityLabel.sttDisable';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _isSTTEnabled } = this.props;

        dispatch(setSTTEnabled(!_isSTTEnabled));
        dispatch(setOverflowMenuVisible(false));
    }

    /**
     * Indicates whether this button is in toggled state or not.
     *
     * @override
     * @protected
     * @returns {boolean}
     */
    override _isToggled() {
        return this.props._isSTTEnabled;
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
    const isModerator = isLocalParticipantModerator(state);

    return {
        _isModerator: isModerator,
        _isSTTEnabled: isSTTEnabled(state),
        visible: isModerator // Only visible to moderators
    };
}

export default translate(connect(_mapStateToProps)(STTButton));

