import React from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconArrowDown, IconArrowUp, IconLivedocSettings } from '../../../base/icons/svg';
import { FakeParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ToolboxItem from '../../../base/toolbox/components/ToolboxItem.web';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { shouldDisplayTileView } from '../../../video-layout/functions.any';
import { isLiveDocShowWithScreenSharing } from '../../functions';

interface IProps extends AbstractButtonProps {
    _annotationPanelVisible: boolean;
    _displayScreenSharingPlaceholder: boolean;
    _isActive: boolean;
    _reduxState: IReduxState;
}

class LiveDocActionMenuButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.liveDocActionMenu';
    override toggledAccessibilityLabel = 'toolbar.accessibilityLabel.liveDocActionMenu';
    override icon = IconLivedocSettings;
    override label = 'toolbar.liveDocActionMenu';
    override toggledLabel = 'toolbar.liveDocActionMenu';
    override tooltip = 'toolbar.liveDocActionMenu';
    override toggledTooltip = 'toolbar.liveDocActionMenu';

    override _handleClick() {
        // 这个方法不接收事件，我们需要在 _onClick 中处理
    }

    /**
     * Override _onClick to capture the click event and send message to iframe.
     *
     * @param {React.MouseEvent} e - The click event.
     * @private
     * @returns {void}
     */
    override _onClick(e?: React.MouseEvent) {
        if (!e) {
            return;
        }

        const { _reduxState } = this.props;
        const actionDialogVisible = _reduxState['features/shared-iframe']?.actionDialogVisible ?? false;

        // 获取点击的绝对位置
        const x = e.pageX;
        const y = e.pageY - 80; // 向上偏移 80px

        // 计算新的 show 值（toggle）
        const newShow = actionDialogVisible ? 0 : 1;

        // 获取 iframe 元素
        const iframe = document.getElementById('sharedIframePlayer') as HTMLIFrameElement;

        if (iframe?.contentWindow) {
            // 向 iframe 发送消息
            iframe.contentWindow.postMessage({
                type: 'Kloud-ShowActionDialog',
                x,
                y,
                show: newShow,
            }, '*');
        }

        // 调用父类的 _onClick 以保持正常行为
        super._onClick(e);
    }

    override _isToggled() {
        return this.props._isActive;
    }

    /**
     * Handles click on the small arrow icon.
     * Sends a message to the iframe to show/hide annotation panel.
     *
     * @param {React.MouseEvent} e - The click event.
     * @private
     * @returns {void}
     */
    _onIconClick = (e?: React.MouseEvent) => {
        if (!e) {
            return;
        }

        const { _annotationPanelVisible } = this.props;

        // 计算新的 status 值（toggle）：1 显示，0 隐藏
        const newStatus = _annotationPanelVisible ? 0 : 1;

        // 获取 iframe 元素
        const iframe = document.getElementById('sharedIframePlayer') as HTMLIFrameElement;

        if (iframe?.contentWindow) {
            // 向 iframe 发送消息
            iframe.contentWindow.postMessage({
                type: 'showAnnotationPanel',
                status: newStatus
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

        // 根据注释面板可见状态决定箭头方向：显示时向下，隐藏时向上
        const arrowIcon = this.props._annotationPanelVisible ? IconArrowDown : IconArrowUp;

        return (
            <ToolboxButtonWithIcon
                icon = { arrowIcon }
                iconDisabled = { false }
                iconId = 'livedoc-action-menu-icon-button'
                iconTooltip = 'Annotation Panel'
                onIconClick = { this._onIconClick }>
                {baseButton}
            </ToolboxButtonWithIcon>
        );
    }
}

function _mapStateToProps(state: IReduxState) {
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;
    const actionDialogVisible = state['features/shared-iframe']?.actionDialogVisible ?? false;
    const annotationPanelVisible = state['features/shared-iframe']?.annotationPanelVisible ?? false;
    const tileView = shouldDisplayTileView(state);

    const _displayScreenSharingPlaceholder = isLiveDocShowWithScreenSharing(state);

    return {
        _annotationPanelVisible: annotationPanelVisible,
        _displayScreenSharingPlaceholder,
        _isActive: actionDialogVisible,
        _reduxState: state,
        // 只在 LiveDoc 时显示按钮
        visible: (onStage && !tileView) || _displayScreenSharingPlaceholder,
    };
}

export default translate(connect(_mapStateToProps)(LiveDocActionMenuButton));

