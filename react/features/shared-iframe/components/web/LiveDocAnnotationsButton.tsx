import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconLivedocAnnotations } from '../../../base/icons/svg';
import { VIDEO_TYPE } from '../../../base/media/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import { FakeParticipant } from '../../../base/participants/types';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { getVideoTrackByParticipant } from '../../../base/tracks/functions.any';
import { isSpotTV } from '../../../base/util/spot';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { setOverflowMenuVisible } from '../../../toolbox/actions.web';
import { shouldDisplayTileView } from '../../../video-layout/functions.any';

interface IProps extends AbstractButtonProps {
    _displayScreenSharingPlaceholder: boolean;
    _docToolShow: boolean;
    _isActive: boolean;
}

/**
 * Component that renders a button for showing/hiding LiveDoc annotations.
 */
class LiveDocAnnotationsButton extends AbstractButton<IProps> {
    override icon = IconLivedocAnnotations;

    /**
     * Gets the accessibility label based on current state.
     *
     * @override
     * @protected
     * @returns {string}
     */
    override _getAccessibilityLabel() {
        return this.props._docToolShow ? 'Hide LiveDoc Annotations' : 'Show LiveDoc Annotations';
    }

    /**
     * Gets the label based on current state.
     *
     * @override
     * @protected
     * @returns {string}
     */
    override _getLabel() {
        return this.props._docToolShow ? 'Hide LiveDoc Annotations' : 'Show LiveDoc Annotations';
    }

    /**
     * Gets the tooltip based on current state.
     *
     * @override
     * @protected
     * @returns {string}
     */
    override _getTooltip() {
        return this.props._docToolShow ? 'Hide LiveDoc Annotations' : 'Show LiveDoc Annotations';
    }

    /**
     * Handles clicking / pressing the button.
     *
     * @private
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        // 获取 iframe 元素
        const iframe = document.getElementById('sharedIframePlayer') as HTMLIFrameElement;

        if (iframe?.contentWindow) {
            // 向 iframe 发送消息
            iframe.contentWindow.postMessage({
                type: 'kloud-showdoctool'
            }, '*');
        }

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
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;
    const tileView = shouldDisplayTileView(state);
    const { seeWhatIsBeingShared } = state['features/large-video'];
    const localParticipantId = getLocalParticipant(state)?.id;
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const videoTrack = getVideoTrackByParticipant(state, largeVideoParticipant);
    const isLocalScreenshareOnLargeVideo = largeVideoParticipant?.id?.includes(localParticipantId ?? '')
        && videoTrack?.videoType === VIDEO_TYPE.DESKTOP;

    const _isActive = onStage && !tileView;
    const _displayScreenSharingPlaceholder = Boolean(isLocalScreenshareOnLargeVideo && !seeWhatIsBeingShared && !isSpotTV(state));
    const _docToolShow = state['features/shared-iframe']?.docToolShow ?? false;

    // 只有在 _isActive 或 _displayScreenSharingPlaceholder 任意一个为 true 时才显示
    const visible = _isActive || _displayScreenSharingPlaceholder;

    return {
        _isActive,
        _displayScreenSharingPlaceholder,
        _docToolShow,
        visible
    };
}

export default translate(connect(_mapStateToProps)(LiveDocAnnotationsButton));

