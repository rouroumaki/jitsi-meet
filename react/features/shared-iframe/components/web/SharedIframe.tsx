import React, { Component } from 'react';
import { connect } from 'react-redux';

import Filmstrip from '../../../../../modules/UI/videolayout/Filmstrip';
import { IReduxState } from '../../../app/types';
import { FakeParticipant } from '../../../base/participants/types';
import { getVerticalViewMaxWidth } from '../../../filmstrip/functions.web';
import { getLargeVideoParticipant } from '../../../large-video/functions';
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
        const { isEnabled, isResizing, isIframeShared, onStage, iframeUrl } = this.props;

        if (!isEnabled || !isIframeShared || !iframeUrl) {
            return null;
        }

        const style: any = this.getDimensions();

        if (!onStage) {
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
    const onStage = getLargeVideoParticipant(state)?.fakeParticipant === FakeParticipant.SharedIframe;
    const isIframeShared = Boolean(active && iframeUrl);

    return {
        clientHeight,
        clientWidth: videoSpaceWidth,
        filmstripVisible: visible,
        filmstripWidth: getVerticalViewMaxWidth(state),
        isEnabled: true, // Shared iframe is always enabled when available
        isResizing: isResizing || isChatResizing,
        isIframeShared,
        onStage,
        iframeUrl
    };
}

export default connect(_mapStateToProps)(SharedIframe);
