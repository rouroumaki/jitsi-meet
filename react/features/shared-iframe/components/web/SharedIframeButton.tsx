import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp, IconLivedoc } from '../../../base/icons/svg';
import { VIDEO_TYPE } from '../../../base/media/constants';
import { getLocalParticipant, isLocalParticipantModerator } from '../../../base/participants/functions';
import { FakeParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ToolboxItem from '../../../base/toolbox/components/ToolboxItem.web';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import { getVideoTrackByParticipant } from '../../../base/tracks/functions.any';
import { isSpotTV } from '../../../base/util/spot';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { showWarningNotification } from '../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../notifications/constants';
import { shouldDisplayTileView } from '../../../video-layout/functions.any';
import { toggleSharedIframe } from '../../actions';

interface IProps extends AbstractButtonProps {
    _displayScreenSharingPlaceholder: boolean;
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

    /**
     * Handles click on the small arrow icon.
     * Sends a message to the iframe with the absolute position of the click.
     *
     * @param {React.MouseEvent} e - The click event.
     * @private
     * @returns {void}
     */
    _onIconClick = (e?: React.MouseEvent) => {
        if (!e) {
            return;
        }

        // 获取点击的绝对位置
        const x = e.pageX;
        const y = e.pageY;

        // 获取 iframe 元素
        const iframe = document.getElementById('sharedIframePlayer') as HTMLIFrameElement;

        if (iframe?.contentWindow) {
            // 向 iframe 发送消息，包含点击的绝对位置
            iframe.contentWindow.postMessage({
                type: 'kloud-showmainpanel',
                x,
                y,
            }, '*');
        }
    };

    /**
     * Implements React's {@link Component#render()}.
     * Overrides the default render to wrap the button with ToolboxButtonWithIcon.
     *
     * @inheritdoc
     * @returns {React$Node}
     */
    override render() {
        const props: any = {
            ...this.props,
            accessibilityLabel: this._getAccessibilityLabel(),
            elementAfter: this._getElementAfter(),
            icon: this._getIcon(),
            label: this._getLabel(),
            labelProps: this.labelProps,
            styles: this._getStyles(),
            toggled: this._isToggled(),
            tooltip: this._getTooltip()
        };

        const baseButton = (
            <ToolboxItem
                disabled = { this._isDisabled() }
                onClick = { this._onClick }
                onKeyDown = { this._onKeyDown }
                { ...props } />
        );

        // 只有在 livedoc active 时才显示小箭头图标
        if (this.props._isActive || this.props._displayScreenSharingPlaceholder) {
            return (
                <ToolboxButtonWithIcon
                    icon = { IconArrowUp }
                    iconDisabled = { false }
                    iconId = 'shared-iframe-icon-button'
                    iconTooltip = 'Live Doc Menu'
                    onIconClick = { this._onIconClick }>
                    {baseButton}
                </ToolboxButtonWithIcon>
            );
        }

        return baseButton;
    }
}

function _mapStateToProps(state: IReduxState) {
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;
    const tileView = shouldDisplayTileView(state);
    const { seeWhatIsBeingShared } = state['features/large-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const videoTrack = getVideoTrackByParticipant(state, largeVideoParticipant);
    const isLocalScreenshareOnLargeVideo = largeVideoParticipant?.id?.includes(localParticipantId ?? '')
        && videoTrack?.videoType === VIDEO_TYPE.DESKTOP;

    return {
        _isActive: onStage && !tileView,
        _reduxState: state,
        _displayScreenSharingPlaceholder: Boolean(isLocalScreenshareOnLargeVideo && !seeWhatIsBeingShared && !isSpotTV(state)),
    };
}

export default translate(connect(_mapStateToProps)(SharedIframeButton));
