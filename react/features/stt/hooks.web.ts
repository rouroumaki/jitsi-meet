import STTButton from './components/STTButton';
import STTDisplayToggleButton from './components/STTDisplayToggleButton';


const sttEnable = {
    key: 'stt-enable',
    Content: STTButton,
    group: 2
};

const sttDisplayToggle = {
    key: 'stt-display-toggle',
    Content: STTDisplayToggleButton,
    group: 2
};

/**
 * A hook that returns the STT enable button (moderator only).
 *
 *  @returns {Object}
 */
export function useSTTEnableButton() {
    return sttEnable;
}

/**
 * A hook that returns the STT display toggle button.
 *
 *  @returns {Object}
 */
export function useSTTDisplayToggleButton() {
    return sttDisplayToggle;
}

