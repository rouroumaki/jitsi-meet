import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import { translate } from '../../../base/i18n/functions';
import { IconLivedoc } from '../../../base/icons/svg';
import { getLocalParticipant, isLocalParticipantModerator } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { setTileView } from '../../../video-layout/actions.any';
import { setSharedIframeActive, startSharedIframe } from '../../actions';
import { SHARED_IFRAME_STATUSES } from '../../constants';
import { sendSharedIframeCommand } from '../../functions';

interface IProps extends AbstractButtonProps {
    _conference?: any;
    _isActive: boolean;
    _localParticipant: any;
    _reduxState: IReduxState;
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
        const { _isActive, _url, _conference, _localParticipant, dispatch } = this.props;

        if (_isActive) {
            // 隐藏 LiveDoc
            dispatch(setSharedIframeActive(false));

            // 只有主持人需要广播给其他参会者
            if (isLocalParticipantModerator(this.props._reduxState)) {
                sendSharedIframeCommand({
                    conference: _conference,
                    localParticipantId: _localParticipant?.id,
                    status: SHARED_IFRAME_STATUSES.HIDE,
                });
            }
        } else if (_url) {
            // 显示 LiveDoc
            dispatch(setTileView(false));
            dispatch(setSharedIframeActive(true));

            // 只有主持人需要广播给其他参会者
            if (isLocalParticipantModerator(this.props._reduxState)) {
                sendSharedIframeCommand({
                    conference: _conference,
                    localParticipantId: _localParticipant?.id,
                    status: SHARED_IFRAME_STATUSES.SHOW,
                });
            }
        } else {
            // 启动新的 LiveDoc 实例
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
        _conference: getCurrentConference(state),
        _reduxState: state,
    };
}

export default translate(connect(_mapStateToProps)(SharedIframeButton));
