import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { getCurrentConference } from '../../../base/conference/functions';
import { translate } from '../../../base/i18n/functions';
import { IconLivedoc } from '../../../base/icons/svg';
import { pinParticipant } from '../../../base/participants/actions';
import { getLocalParticipant, isLocalParticipantModerator } from '../../../base/participants/functions';
import { FakeParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { showWarningNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { shouldDisplayTileView } from '../../../video-layout/functions.any';
import { startSharedIframe } from '../../actions';
import { SHARED_IFRAME_STATUSES } from '../../constants';
import { sendSharedIframeCommand } from '../../functions';
import { addStageParticipant } from '../../../filmstrip/actions.web';

interface IProps extends AbstractButtonProps {
    _conference?: any;
    _isActive: boolean;
    _localParticipant: any;
    _reduxState: IReduxState;
    _url?: string;
}

class SharedIframeButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'Show LiveDoc';
    override toggledAccessibilityLabel = 'Show LiveDoc';
    override icon = IconLivedoc;
    override label = 'Show LiveDoc';
    override toggledLabel = 'Show LiveDoc';
    override tooltip = 'Show LiveDoc';
    override toggledTooltip = 'Show LiveDoc';

    override async _handleClick() {
        const { _isActive, _url, _conference, _localParticipant, dispatch } = this.props;

        // 只有主持人才能切换 LiveDoc
        if (!isLocalParticipantModerator(this.props._reduxState)) {
            dispatch(showWarningNotification({
                titleKey: 'notify.moderatorOnlyViewChange'
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            return;
        }

        if (_isActive) {
        } else if (_url) {
            // 显示 LiveDoc
            dispatch(pinParticipant('livedoc'));

            sendSharedIframeCommand({
                conference: _conference,
                localParticipantId: _localParticipant?.id,
                status: SHARED_IFRAME_STATUSES.SHOW,
            });
        } else {
            // 启动新的 LiveDoc 实例
            dispatch(startSharedIframe('https://kloud.cn/GoogleMeet/MainStage/1234567890/0'));
        }
    }

    override _isToggled() {
        return this.props._isActive;
    }
}

function _mapStateToProps(state: IReduxState) {
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;
    const tileView = shouldDisplayTileView(state);

    return {
        _isActive: onStage && !tileView,
        _url: state['features/shared-iframe']?.url,
        _localParticipant: getLocalParticipant(state),
        _conference: getCurrentConference(state),
        _reduxState: state,
    };
}

export default translate(connect(_mapStateToProps)(SharedIframeButton));
