import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconLivedoc } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setTileView } from '../../../video-layout/actions.any';
import { setSharedIframeActive, startSharedIframe } from '../../actions';

interface IProps extends AbstractButtonProps {
    _isActive: boolean;
    _localParticipant: any;
    _url?: string;
}

class SharedIframeButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'Show LiveDoc';
    override toggledAccessibilityLabel = 'Hide LiveDoc';
    override icon = IconLivedoc;
    override label = 'Show LiveDoc';
    override toggledLabel = 'Hide LiveDoc';
    override tooltip = 'Show LiveDoc';
    override toggledTooltip = 'Hide LiveDoc';

    override async _handleClick() {
        const { _isActive, _url, dispatch } = this.props;

        if (_isActive) {
            dispatch(setSharedIframeActive(false));
        } else if (_url) {
            dispatch(setTileView(false));
            dispatch(setSharedIframeActive(true));
        } else {
            dispatch(setTileView(false));
            dispatch(startSharedIframe('https://kloud.cn/GoogleMeet/MainStage/1234567890/0'));
        }
    }

    override _isToggled() {
        return this.props._isActive;
    }
}

function _mapStateToProps(state: IReduxState) {
    return {
        _isActive: Boolean(state['features/shared-iframe']?.active),
        _url: state['features/shared-iframe']?.url,
        _localParticipant: getLocalParticipant(state),
    };
}

export default translate(connect(_mapStateToProps)(SharedIframeButton));
