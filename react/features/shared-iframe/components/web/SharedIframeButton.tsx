import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconLivedoc } from '../../../base/icons/svg';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import { FakeParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { showWarningNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { shouldDisplayTileView } from '../../../video-layout/functions.any';
import { toggleSharedIframe } from '../../actions';

interface IProps extends AbstractButtonProps {
    _isActive: boolean;
    _reduxState: IReduxState;
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
        const { _isActive, dispatch } = this.props;

        // 只有主持人才能切换 LiveDoc
        if (!isLocalParticipantModerator(this.props._reduxState)) {
            dispatch(showWarningNotification({
                titleKey: 'notify.moderatorOnlyViewChange'
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));

            return;
        }

        // 如果已经激活，则不执行任何操作；否则切换 LiveDoc
        if (!_isActive) {
            dispatch(toggleSharedIframe());
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
        _reduxState: state,
    };
}

export default translate(connect(_mapStateToProps)(SharedIframeButton));
