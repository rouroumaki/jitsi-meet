import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { IconSubtitles } from '../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../base/toolbox/components/AbstractButton';
import { setOverflowMenuVisible } from '../../toolbox/actions.web';
import { setSubtitleVisible } from '../actions';
import { isSTTEnabled, isSubtitleVisible } from '../functions';

interface IProps extends AbstractButtonProps {
    _isSTTEnabled?: boolean;
    _isSubtitleVisible?: boolean;
}

/**
 * Component that renders a button for toggling subtitle visibility.
 */
class STTDisplayToggleButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sttDisplayToggle';
    override icon = IconSubtitles;
    override label = 'toolbar.accessibilityLabel.sttShowSubtitles';
    override tooltip = 'toolbar.accessibilityLabel.sttShowSubtitles';
    override toggledLabel = 'toolbar.accessibilityLabel.sttHideSubtitles';

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch, _isSubtitleVisible } = this.props;

        dispatch(setSubtitleVisible(!_isSubtitleVisible));
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
        return this.props._isSubtitleVisible;
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
    const sttEnabled = isSTTEnabled(state);

    return {
        _isSTTEnabled: sttEnabled,
        _isSubtitleVisible: isSubtitleVisible(state),
        visible: sttEnabled // Only visible when STT is enabled
    };
}

export default translate(connect(_mapStateToProps)(STTDisplayToggleButton));

