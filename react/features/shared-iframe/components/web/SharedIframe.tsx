import React, { Component } from 'react';
import { connect } from 'react-redux';

// @ts-ignore
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
import { VIDEO_TYPE } from '../../../base/media/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import { FakeParticipant } from '../../../base/participants/types';
import { getVideoTrackByParticipant } from '../../../base/tracks/functions.any';
import { isSpotTV } from '../../../base/util/spot';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getLargeVideoParticipant } from '../../../large-video/functions';
import { hideLoadingNotification } from '../../../notifications/actions';
import { showToolbox } from '../../../toolbox/actions.web';
import { setSharedIframeState, setWebcamVisible } from '../../actions';

interface IProps {
    /**
     * Whether the screen-sharing placeholder should be displayed or not.
     */
    _displayScreenSharingPlaceholder: boolean;

    /**
     * Whether the webcam is visible.
     */
    _webcamVisible: boolean;

    /**
     * The available client width.
     */
    clientHeight: number;

    /**
     * The available client width.
     */
    clientWidth: number;

    /**
     * Redux dispatch function.
     */
    dispatch: Function;

    /**
     * Whether the (vertical) filmstrip is visible or not.
     */
    filmstripVisible: boolean;

    /**
     * The width of the vertical filmstrip.
     */
    filmstripWidth: number;

    /**
     * The shared iframe url.
     */
    iframeUrl?: string;

    /**
     * Whether the shared iframe is enabled or not.
     */
    isEnabled: boolean;

    /**
     * Whether the user is actively resizing the filmstrip.
     */
    isResizing: boolean;

    /**
     * Whether the shared iframe should be shown on stage.
     */
    onStage: boolean;

}

/** .
 * Implements a React {@link Component} which represents the shared iframe (a.k.a.
 * The shared iframe content that is on the local stage) on Web/React.
 *
 * @augments Component
 */
class SharedIframe extends Component<IProps> {
    private _messageListener?: (event: MessageEvent) => void;

    /**
     * Handles messages from the iframe.
     *
     * @param {MessageEvent} event - The message event.
     * @private
     * @returns {void}
     */
    _handleIframeMessage = (event: MessageEvent) => {
        // 确保消息来自我们的 iframe
        const iframe = document.getElementById('sharedIframePlayer') as HTMLIFrameElement;

        if (!iframe || event.source !== iframe.contentWindow) {
            return;
        }

        try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

            // 处理不同类型的消息
            switch (data.type) {
            case 'mousemove':
                this.props.dispatch(showToolbox());
                break;
            case 'onkloudloaded':
                this.props.dispatch(hideLoadingNotification());
                break;
            case 'onkloudswitchfile':
                if (data.data.IsWhiteboard) {
                    this.props.dispatch(setSharedIframeState({ isWhiteboard: true }));
                } else {
                    this.props.dispatch(setSharedIframeState({ isWhiteboard: false }));
                }
                break;
            case 'onklouddoctoolstatchange':
                // 处理文档工具状态变化消息，data.show 为 1 表示 Show，0 表示 Hide
                this.props.dispatch(setSharedIframeState({ docToolShow: data.data?.show === 1 }));
                break;
            case 'onKloudMainPanelVisibleChange':
                // 处理主面板可见性变化消息，data.show 为 1 表示显示，0 表示隐藏
                this.props.dispatch(setSharedIframeState({ mainPanelVisible: data.data?.show === 1 }));
                break;
            case 'onKloudActionDialogVisibleChange':
                // 处理操作对话框可见性变化消息，data.show 为 1 表示显示，0 表示隐藏
                this.props.dispatch(setSharedIframeState({ actionDialogVisible: data.data?.show === 1 }));
                break;
            case 'showAnnotationPanel':
                // 处理注释面板显示/隐藏消息，status 为 1 表示显示，0 表示隐藏
                this.props.dispatch(setSharedIframeState({ annotationPanelVisible: data.status === 1 }));
                break;
            case 'Kloud-ShowWebcamView':
                this.props.dispatch(setWebcamVisible(true));
                break;
                // case 'onkloudjoinmeeting':
                //     const { iframeUrl } = this.props;

                //     const url = iframeUrl?.split('?')[0];

                //     sendSharedIframeCommand({
                //         conference: '',
                //         status: SHARED_IFRAME_STATUSES.START,
                //         url,
                //     });

            default:
                break;
            }
        } catch (error) {
            console.warn('Failed to parse message from LiveDoc iframe:', error);
        }
    };

    /**
     * Implements React's {@link Component#componentDidMount()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        this._messageListener = this._handleIframeMessage;
        window.addEventListener('message', this._messageListener);
    }

    /**
     * Sync computed iframeUrl into redux state when it changes (e.g. placeholder mode).
     *
     * @param {IProps} prevProps - Previous props for comparison.
     * @returns {void}
     */
    override componentDidUpdate() {
        const { _displayScreenSharingPlaceholder, dispatch } = this.props;

        if (_displayScreenSharingPlaceholder) {
            dispatch(setSharedIframeState({ isScreenShared: true }));
        }
    }

    /**
     * Implements React's {@link Component#componentWillUnmount()}.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentWillUnmount() {
        if (this._messageListener) {
            window.removeEventListener('message', this._messageListener);
            this._messageListener = undefined;
        }
    }

    /**
     * Computes the width and the height of the component.
     *
     * @returns {{
     *  height: number,
     *  width: number
     * }}
     */
    getDimensions() {
        const { clientHeight, clientWidth, filmstripVisible, filmstripWidth } = this.props;

        let width;
        let height;

        const sidebarVisible = this.props._webcamVisible && filmstripVisible;

        if ((window as any).interfaceConfig?.VERTICAL_FILMSTRIP) {
            if (sidebarVisible) {
                width = `${clientWidth - filmstripWidth}px`;
            } else {
                width = `${clientWidth}px`;
            }
            height = `${clientHeight}px`;
        } else {
            if (sidebarVisible) {
                height = `${clientHeight - Filmstrip.getFilmstripHeight()}px`;
            } else {
                height = `${clientHeight}px`;
            }
            width = `${clientWidth}px`;
        }

        return {
            width,
            height
        };
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {React$Element}
     */
    override render() {
        const { isEnabled, isResizing, onStage, iframeUrl, _displayScreenSharingPlaceholder } = this.props;

        // 仅在没有 url 时不渲染；有 url 时始终挂载，避免重新加载 iframe
        if ((!isEnabled || !iframeUrl) && !_displayScreenSharingPlaceholder) {
            return null;
        }

        const style: any = this.getDimensions();

        if (!onStage && !_displayScreenSharingPlaceholder) {
            style.display = 'none';
        }

        return (
            <div
                className = { (isResizing && 'disable-pointer') || '' }
                id = 'sharedIframe'
                style = { style }>
                <iframe
                    allow = 'fullscreen *; autoplay *'
                    id = 'sharedIframePlayer'
                    sandbox = 'allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin allow-modals'
                    src = { iframeUrl }
                    // eslint-disable-next-line react-native/no-inline-styles
                    style = {{ width: '100%', height: '100%', border: 'none' }} />
            </div>
        );
    }
}


/**
 * Maps (parts of) the Redux state to the associated SharedIframe props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    let { url: iframeUrl } = state['features/shared-iframe'] || {};
    const { clientHeight, videoSpaceWidth } = state['features/base/responsive-ui'];
    const { visible, isResizing } = state['features/filmstrip'];
    const { isResizing: isChatResizing } = state['features/chat'];
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;
    const { seeWhatIsBeingShared } = state['features/large-video'];
    const { id: localParticipantId } = getLocalParticipant(state) || {};
    const largeVideoParticipant = getLargeVideoParticipant(state);
    const videoTrack = getVideoTrackByParticipant(state, largeVideoParticipant);
    const isLocalScreenshareOnLargeVideo = largeVideoParticipant?.id?.includes(localParticipantId ?? '')
        && videoTrack?.videoType === VIDEO_TYPE.DESKTOP;

    const _displayScreenSharingPlaceholder = Boolean(isLocalScreenshareOnLargeVideo && !seeWhatIsBeingShared && !isSpotTV(state));

    if (_displayScreenSharingPlaceholder) {
        // 从本地获取登录令牌
        const localToken = localStorage.getItem('KloudUserToken');
        const livedocInstanceId = state['features/shared-iframe']?.livedocInstanceId;

        iframeUrl = `https://kloud.cn/GoogleMeet/MainStage/${livedocInstanceId}/0?token=${localToken}&usetoken=1&fromjitsi=1`;
    }

    return {
        clientHeight,
        clientWidth: videoSpaceWidth,
        filmstripVisible: visible,
        filmstripWidth: getVerticalViewMaxWidth(state),
        isEnabled: true, // Shared iframe is always enabled when available
        isResizing: isResizing || isChatResizing,
        onStage,
        iframeUrl,
        _displayScreenSharingPlaceholder,
        _webcamVisible: state['features/shared-iframe'].webcamVisible ?? false
    };
}

export default connect(_mapStateToProps)(SharedIframe);
