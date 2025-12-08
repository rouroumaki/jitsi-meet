import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';
import { FakeParticipant } from '../base/participants/types';
import { getLargeVideoParticipant } from '../large-video/functions';
import { shouldDisplayTileView } from '../video-layout/functions.any';

import { LiveDocActionMenuButton, LiveDocAnnotationsButton, SharedIframeButton } from './components/index.web';
import { isLiveDocShowWithScreenSharing } from './functions';
// Fix import path mapping for web index export
// @ts-ignore
export * from './components/index.web';

const sharedIframe = {
    key: 'sharediframe',
    Content: SharedIframeButton,
    group: 3
};

const liveDocAnnotations = {
    key: 'livedocannotations',
    Content: LiveDocAnnotationsButton,
    group: 4
};

const liveDocActionMenu = {
    key: 'livedocactionmenu',
    Content: LiveDocActionMenuButton,
    group: 3
};

export function useSharedIframeButton() {
    // Make the button always available in this local build.
    const _ = useSelector((state: IReduxState) => state);

    return sharedIframe;
}

export function useLiveDocAnnotationsButton() {
    // Make the button always available in this local build.
    const _ = useSelector((state: IReduxState) => state);

    return liveDocAnnotations;
}

export function useLiveDocActionMenuButton() {
    // 只在 LiveDoc active 时返回按钮配置
    const onStage = useSelector((state: IReduxState) => {
        const largeVideoParticipant = getLargeVideoParticipant(state);

        return largeVideoParticipant?.fakeParticipant === FakeParticipant.SharedIframe;
    });
    const tileView = useSelector((state: IReduxState) => shouldDisplayTileView(state));

    const isActive = onStage && !tileView;

    const isLiveDocShowWithScreenSharingResult = useSelector((state: IReduxState) => isLiveDocShowWithScreenSharing(state));

    if (isActive || isLiveDocShowWithScreenSharingResult) {
        return liveDocActionMenu;
    }
}

