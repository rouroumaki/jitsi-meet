import React, { Component } from 'react';
import { connect } from 'react-redux';

// @ts-ignore
import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
// import { FakeParticipant } from '../../../base/participants/types';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
// import { hideLoadingNotification } from '../../../notifications/actions';
import { showToolbox } from '../../../toolbox/actions.web';
// import { getToolboxHeight } from '../../../toolbox/functions.web';

interface IProps {
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
     * Whether the shared iframe is currently active.
     */
    isIframeShared: boolean;

    /**
     * Whether the user is actively resizing the filmstrip.
     */
    isResizing: boolean;

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
                // this.props.dispatch(hideLoadingNotification());
                break;
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

        if ((window as any).interfaceConfig?.VERTICAL_FILMSTRIP) {
            if (filmstripVisible) {
                width = `${clientWidth - filmstripWidth}px`;
            } else {
                width = `${clientWidth}px`;
            }
            height = `${clientHeight}px`;
        } else {
            if (filmstripVisible) {
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
        const { isEnabled, isResizing, isIframeShared, iframeUrl } = this.props;

        // 仅在没有 url 时不渲染；有 url 时始终挂载，避免重新加载 iframe
        if (!isEnabled || !iframeUrl) {
            return null;
        }

        const style: any = this.getDimensions();

        // onStage 原来是onStage逻辑 用于判断participant是否是sharediframe
        if (!isIframeShared) {
            // eslint-disable-next-line react-native/no-inline-styles
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
                    sandbox = 'allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin'
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
    const { url: iframeUrl, active } = state['features/shared-iframe'] || { active: false };
    const { clientHeight, videoSpaceWidth } = state['features/base/responsive-ui'];
    const { visible, isResizing } = state['features/filmstrip'];
    const { isResizing: isChatResizing } = state['features/chat'];
    const isIframeShared = Boolean(active && iframeUrl);

    return {
        clientHeight,
        clientWidth: videoSpaceWidth,
        filmstripVisible: visible,
        filmstripWidth: getVerticalViewMaxWidth(state),
        isEnabled: true, // Shared iframe is always enabled when available
        isResizing: isResizing || isChatResizing,
        isIframeShared,
        iframeUrl
    };
}

export default connect(_mapStateToProps)(SharedIframe);
