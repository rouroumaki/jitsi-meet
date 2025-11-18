import STTButton from './components/STTButton';
import STTSettingsButton from './components/STTSettingsButton';


const sttEnable = {
    key: 'stt-enable',
    Content: STTButton,
    group: 2
};

const sttSettings = {
    key: 'stt-settings',
    Content: STTSettingsButton,
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
 * A hook that returns the STT settings button.
 *
 *  @returns {Object}
 */
export function useSTTSettingsButton() {
    return sttSettings;
}

