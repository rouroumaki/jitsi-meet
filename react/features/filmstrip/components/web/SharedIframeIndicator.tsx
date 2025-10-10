import React from 'react';

import { IconLivedoc } from '../../../base/icons/svg';
import BaseIndicator from '../../../base/react/components/web/BaseIndicator';
import { TOOLTIP_POSITION } from '../../../base/ui/constants.any';

interface IProps {

    /**
     * From which side of the indicator the tooltip should appear from.
     */
    tooltipPosition: TOOLTIP_POSITION;
}

/**
 * React {@code Component} for showing a shared iframe icon with a tooltip.
 *
 * @param {IProps} props - React props passed to this component.
 * @returns {React$Element<any>}
 */
export default function SharedIframeIndicator(props: IProps) {
    return (
        <BaseIndicator
            icon = { IconLivedoc }
            iconId = 'share-iframe'
            iconSize = { 16 }
            tooltipKey = 'videothumbnail.sharedIframe'
            tooltipPosition = { props.tooltipPosition } />
    );
}
