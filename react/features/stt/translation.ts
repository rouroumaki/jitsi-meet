import { detect } from 'tinyld';
/**
 * Translation utility functions for STT feature.
 */

const TRANSLATION_API_URL = 'https://wss.peertime.cn/MeetingServer/translation/xunfei_translation';

/**
 * Language code mapping from tinyld ISO 639-1 format to API format.
 * Tinyld returns ISO 639-1 codes (zh, en, ja, ko), which mostly match our API format.
 */
const LANGUAGE_CODE_MAP: { [key: string]: string; } = {
    'zh': 'cn', // Chinese
    'en': 'en', // English
    'ko': 'ko', // Korean
    'ja': 'ja' // Japanese
};

/**
 * Maps language code from tinyld ISO 639-1 format to API format.
 *
 * @param {string} tinyldCode - Language code from tinyld library (ISO 639-1).
 * @returns {string} Language code in API format.
 */
function mapLanguageCodeToAPI(tinyldCode: string): string {
    return LANGUAGE_CODE_MAP[tinyldCode] || tinyldCode;
}

/**
 * Detects the language of the given text using tinyld.
 * Tinyld is optimized for short text detection and returns ISO 639-1 codes.
 *
 * @param {string} text - The text to detect language for.
 * @returns {string} Detected language code in API format (cn, en, ko, ja), or 'auto' if detection fails.
 */
export function detectLanguage(text: string): string {
    try {
        // tinyld is better for short texts and returns ISO 639-1 codes
        const detected = detect(text);

        if (detected && detected !== 'unknown') {
            return mapLanguageCodeToAPI(detected);
        }

        // Default to 'auto' if detection fails
        return 'auto';
    } catch (error) {
        console.error('Failed to detect language:', error);

        return 'auto';
    }
}

/**
 * Translates text using the translation API.
 *
 * @param {string} text - The text to translate.
 * @param {string} targetLangId - Target language ID (cn, en, ko, ja).
 * @param {string} sourceLangId - Source language ID, defaults to 'auto'.
 * @returns {Promise<string>} Translated text.
 */
export async function translateText(
        text: string,
        targetLangId: string,
        sourceLangId: string = 'auto'
): Promise<string> {
    try {
        const response = await fetch(TRANSLATION_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'UserToken': localStorage.getItem('KloudUserToken') || '6293a7c8-b9c9-4155-9095-6ea73b795b46'
            },
            body: JSON.stringify({
                text,
                sourceLangId,
                targetLangId
            })
        });

        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.code === 0 && result.data) {
            return result.data;
        }

        throw new Error(`Translation API returned error: ${result.msg || 'Unknown error'}`);
    } catch (error) {
        console.error('Translation failed:', error);
        throw error;
    }
}
