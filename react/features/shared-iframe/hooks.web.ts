import { useSelector } from 'react-redux';

import { IReduxState } from '../app/types';

import { LiveDocAnnotationsButton, SharedIframeButton } from './components/index.web';
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

