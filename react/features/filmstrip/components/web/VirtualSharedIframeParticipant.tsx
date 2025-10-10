import React, { TouchEventHandler } from 'react';
import { useSelector } from 'react-redux';
import { useStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';

import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';

interface IProps {

    /**
     * Indicates whether the thumbnail is for local shared iframe or not.
     */
    _isLocal: boolean;

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<
        'containerBackground' |
        'indicatorsContainer' |
        'indicatorsTopContainer' |
        'tintBackground' |
        'indicatorsBottomContainer' |
        'indicatorsBackground',
        string
    >>;

    /**
     * The class name that will be used for the container.
     */
    containerClassName: string;

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean;

    /**
     * Indicates whether we are currently running in a mobile browser.
     */
    isMobile: boolean;

    /**
     * Click handler.
     */
    onClick: (e?: React.MouseEvent) => void;

    /**
     * Mouse enter handler.
     */
    onMouseEnter: (e?: React.MouseEvent) => void;

    /**
     * Mouse leave handler.
     */
    onMouseLeave: (e?: React.MouseEvent) => void;

    /**
     * Mouse move handler.
     */
    onMouseMove: (e?: React.MouseEvent) => void;

    /**
     * Touch end handler.
     */
    onTouchEnd: TouchEventHandler;

    /**
     * Touch move handler.
     */
    onTouchMove: TouchEventHandler;

    /**
     * Touch start handler.
     */
    onTouchStart: TouchEventHandler;
    /**
     * The ID of the virtual shared iframe participant.
     */
    participantId: string;

    /**
     * An object with the styles for thumbnail.
     */
    styles: any;

    /**
     * The type of thumbnail.
     */
    thumbnailType: string;
}

const VirtualSharedIframeParticipant = ({
    classes,
    containerClassName,
    isHovered,
    _isLocal,
    isMobile,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onMouseMove,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
    participantId,
    styles,
    thumbnailType
}: IProps) => {
    const currentLayout = useSelector(getCurrentLayout);
    const iframeUrl = useSelector((state: IReduxState) => state['features/shared-iframe']?.url);


    const { cx } = useStyles();

    const iframeStyle = {
        width: '100%',
        height: '100%',
        border: 'none',
        position: 'absolute' as const,
        top: 0,
        left: 0,
        pointerEvents: 'none' as const
    };

    return (
        <span
            className = { containerClassName }
            id = { `participant_${participantId}` }
            { ...(isMobile
                ? {
                    onTouchEnd,
                    onTouchMove,
                    onTouchStart
                }
                : {
                    onClick,
                    onMouseEnter,
                    onMouseMove,
                    onMouseLeave
                }
            ) }
            style = { styles.thumbnail }>
            {/* Shared iframe content */}
            {iframeUrl && (
                <iframe
                    allow = 'fullscreen *; autoplay *'
                    id = { `sharedIframeThumbnail_${participantId}` }
                    sandbox = 'allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin'
                    src = { iframeUrl + '11' }
                    style = { iframeStyle } />
            )}
            {/* <div className = { classes?.containerBackground } /> */}
            <div
                className = { cx(classes?.indicatorsContainer,
                        classes?.indicatorsTopContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailTopIndicators
                    isHovered = { isHovered }
                    participantId = { participantId }
                    thumbnailType = { thumbnailType } />
            </div>
            {/* {shouldDisplayTintBackground && <div className = { classes?.tintBackground } />} */}
            <div
                className = { cx(classes?.indicatorsContainer,
                        classes?.indicatorsBottomContainer,
                        currentLayout === LAYOUTS.TILE_VIEW && 'tile-view-mode'
                ) }>
                <ThumbnailBottomIndicators
                    className = { classes?.indicatorsBackground }
                    local = { false }
                    participantId = { participantId }
                    showStatusIndicators = { true } />
            </div>
        </span>);
};

export default VirtualSharedIframeParticipant;
