import React, { useCallback, useEffect, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { openDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { MultiSelectItem } from '../../base/ui/components/types';
import Button from '../../base/ui/components/web/Button';
import Dialog from '../../base/ui/components/web/Dialog';
import Input from '../../base/ui/components/web/Input';
import Switch from '../../base/ui/components/web/Switch';
import { setSubtitleVisible as setSubtitleVisibleAction } from '../actions';
import { isSubtitleVisible } from '../functions';
import { sttSDKManager } from '../sdkManager';

import LanguageSelectDialog from './LanguageSelectDialog';

const STORAGE_KEY = 'stt-language-settings';

interface IProps extends WithTranslation {
    _isSubtitleVisible?: boolean;
    dispatch?: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        selectContainer: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: theme.spacing(4),
        },
        labelRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing(2)
        },
        label: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
        },
        selectButton: {
            marginLeft: theme.spacing(2)
        },
        bottomMargin: {
            marginBottom: theme.spacing(2)
        },
        controlRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing(4)
        },
        switchLabel: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        }
    };
});

/**
 * Loads settings from localStorage.
 *
 * @returns {Object}
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
            return JSON.parse(saved);
        }
    } catch (error) {
        // Ignore parse errors
    }

    return {
        speakLanguages: [],
        readLanguages: [ 'zh' ],
        defaultReadLanguage: 'zh',
        subtitleVisible: true
    };
}

/**
 * Saves settings to localStorage.
 *
 * @param {Object} settings - The settings to save.
 * @returns {void}
 */
function saveSettings(settings: { defaultReadLanguage?: string; readLanguages: string[]; speakLanguages: string[]; subtitleVisible: boolean; }) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        // Ignore storage errors
    }
}

/**
 * Component that renders a dialog for STT language settings.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
function STTSettingsDialog({ t, dispatch, _isSubtitleVisible }: IProps) {
    const { classes } = useStyles();
    const [ readLanguages, setReadLanguages ] = useState<MultiSelectItem[]>([]);
    const [ selectedSpeakLanguages, setSelectedSpeakLanguages ] = useState<MultiSelectItem[]>([]);
    const [ defaultReadLanguage, setDefaultReadLanguage ] = useState<MultiSelectItem | null>(null);
    const [ subtitleVisible, setSubtitleVisible ] = useState(_isSubtitleVisible ?? true);

    /**
     * Gets available language options.
     *
     * @returns {Array<MultiSelectItem>} Available language options.
     */
    const getAvailableLanguages = useCallback((): MultiSelectItem[] => {
        return [
            {
                content: t('toolbar.sttLanguage.chinese'),
                value: 'zh'
            },
            {
                content: t('toolbar.sttLanguage.english'),
                value: 'en'
            },
            {
                content: t('toolbar.sttLanguage.korean'),
                value: 'ko'
            }
        ];
    }, [ t ]);

    // Load settings on mount
    useEffect(() => {
        const savedSettings = loadSettings();
        const availableLanguages = getAvailableLanguages();

        // Convert saved speak languages to MultiSelectItem format
        const savedSpeakLanguages = (savedSettings.speakLanguages || [])
            .map((lang: string) => availableLanguages.find(item => item.value === lang))
            .filter(Boolean) as MultiSelectItem[];

        // Convert saved read languages to MultiSelectItem format
        // Handle backward compatibility: if readLanguage exists (old format), convert it
        const readLangs = savedSettings.readLanguages || (savedSettings.readLanguage ? [ savedSettings.readLanguage ] : [ 'zh' ]);
        const savedReadLanguages = readLangs
            .map((lang: string) => availableLanguages.find(item => item.value === lang))
            .filter(Boolean) as MultiSelectItem[];

        const finalReadLanguages = savedReadLanguages.length > 0 ? savedReadLanguages : [ availableLanguages[0] ];

        setReadLanguages(finalReadLanguages);
        setSelectedSpeakLanguages(savedSpeakLanguages);

        // Set default read language
        const savedDefaultReadLang = savedSettings.defaultReadLanguage;

        if (savedDefaultReadLang) {
            const defaultLang = availableLanguages.find(item => item.value === savedDefaultReadLang);

            if (defaultLang && finalReadLanguages.find(lang => lang.value === defaultLang.value)) {
                setDefaultReadLanguage(defaultLang);
            } else if (finalReadLanguages.length === 1) {
                setDefaultReadLanguage(finalReadLanguages[0]);
            }
        } else if (finalReadLanguages.length === 1) {
            // If only one read language, set it as default

            setDefaultReadLanguage(finalReadLanguages[0]);
        }

        // Load subtitleVisible from localStorage, fallback to Redux state or true
        setSubtitleVisible(savedSettings.subtitleVisible !== undefined
            ? savedSettings.subtitleVisible
            : (_isSubtitleVisible ?? true));
    }, [ getAvailableLanguages, _isSubtitleVisible ]);

    /**
     * Handles subtitle visibility toggle.
     * Only updates local state, Redux will be updated on save.
     *
     * @param {boolean|undefined} visible - Whether subtitles should be visible.
     * @returns {void}
     */
    const onSubtitleVisibilityToggle = useCallback((visible?: boolean) => {
        const newValue = visible ?? false;

        setSubtitleVisible(newValue);
    }, []);

    /**
     * Handles form submission.
     * Saves all settings to localStorage and updates Redux state.
     *
     * @returns {void}
     */
    // Auto-update defaultReadLanguage when readLanguages changes
    useEffect(() => {
        if (readLanguages.length === 1) {
            setDefaultReadLanguage(readLanguages[0]);
        } else if (defaultReadLanguage && !readLanguages.find(lang => lang.value === defaultReadLanguage.value)) {
            // If current default is not in readLanguages, clear it
            setDefaultReadLanguage(null);
        }
    }, [ readLanguages, defaultReadLanguage ]);

    const onSubmit = useCallback(async (params = {}) => {
        const settings = {
            speakLanguages: selectedSpeakLanguages.map(item => item.value),
            readLanguages: readLanguages.map(item => item.value),
            defaultReadLanguage: defaultReadLanguage?.value,
            subtitleVisible,
            ...params
        };

        saveSettings(settings);
        if (dispatch) {
            dispatch(setSubtitleVisibleAction(subtitleVisible));
        }

        // 调用 SDK 设置说话语言
        try {
            await sttSDKManager.setSpeakingLanguageID();
        } catch (error) {
            // 记录错误但不阻止设置保存
            console.error('Failed to set speaking language ID', error);
        }
    }, [ selectedSpeakLanguages, readLanguages, defaultReadLanguage, subtitleVisible, dispatch ]);

    /**
     * Handles opening the language selection dialog for speak languages.
     *
     * @returns {void}
     */
    const onOpenSpeakLanguagesDialog = useCallback(() => {
        if (dispatch) {
            dispatch(openDialog(LanguageSelectDialog, {
                availableLanguages: getAvailableLanguages(),
                onConfirm: (selected: MultiSelectItem[]) => {
                    setSelectedSpeakLanguages(selected);
                    onSubmit({ speakLanguages: selected.map(item => item.value) });

                    // Reopen STTSettingsDialog after LanguageSelectDialog closes

                    setTimeout(() => {
                        const STTSettingsDialogComponent = require('./STTSettingsDialog').default;

                        dispatch(openDialog(STTSettingsDialogComponent));
                    }, 100);
                },
                onCancel: () => {
                    // Reopen STTSettingsDialog after LanguageSelectDialog closes

                    setTimeout(() => {
                        const STTSettingsDialogComponent = require('./STTSettingsDialog').default;

                        dispatch(openDialog(STTSettingsDialogComponent));
                    }, 100);
                },
                selectedLanguages: selectedSpeakLanguages,
                titleKey: 'toolbar.sttSettings.selectSpeakLanguages'
            }));
        }
    }, [ dispatch, getAvailableLanguages, selectedSpeakLanguages ]);


    /**
     * Handles opening the language selection dialog for read languages.
     *
     * @returns {void}
     */
    const onOpenReadLanguagesDialog = useCallback(() => {
        if (dispatch) {
            dispatch(openDialog(LanguageSelectDialog, {
                availableLanguages: getAvailableLanguages(),
                onConfirm: (selected: MultiSelectItem[]) => {
                    const newReadLanguages = selected.length > 0 ? selected : [ getAvailableLanguages()[0] ];

                    setReadLanguages(newReadLanguages);
                    onSubmit({ readLanguages: newReadLanguages.map(item => item.value) });

                    // Reopen STTSettingsDialog after LanguageSelectDialog closes

                    setTimeout(() => {
                        const STTSettingsDialogComponent = require('./STTSettingsDialog').default;

                        dispatch(openDialog(STTSettingsDialogComponent));
                    }, 100);
                },
                onCancel: () => {
                    // Reopen STTSettingsDialog after LanguageSelectDialog closes

                    setTimeout(() => {
                        const STTSettingsDialogComponent = require('./STTSettingsDialog').default;

                        dispatch(openDialog(STTSettingsDialogComponent));
                    }, 100);
                },
                selectedLanguages: readLanguages,
                titleKey: 'toolbar.sttSettings.selectReadLanguage'
            }));
        }
    }, [ dispatch, getAvailableLanguages, readLanguages ]);


    /**
     * Handles opening the default read language selection dialog.
     *
     * @returns {void}
     */
    const onOpenDefaultReadLanguageDialog = useCallback(() => {
        if (dispatch && readLanguages.length > 1) {
            dispatch(openDialog(LanguageSelectDialog, {
                availableLanguages: readLanguages,
                onConfirm: (selected: MultiSelectItem[]) => {
                    if (selected.length > 0) {
                        setDefaultReadLanguage(selected[0]);
                        onSubmit({ defaultReadLanguage: selected[0].value });
                    }

                    // Reopen STTSettingsDialog after LanguageSelectDialog closes
                    setTimeout(() => {
                        const STTSettingsDialogComponent = require('./STTSettingsDialog').default;

                        dispatch(openDialog(STTSettingsDialogComponent));
                    }, 100);
                },
                onCancel: () => {
                    // Reopen STTSettingsDialog after LanguageSelectDialog closes
                    setTimeout(() => {
                        const STTSettingsDialogComponent = require('./STTSettingsDialog').default;

                        dispatch(openDialog(STTSettingsDialogComponent));
                    }, 100);
                },
                selectedLanguages: defaultReadLanguage ? [ defaultReadLanguage ] : [],
                singleSelect: true,
                titleKey: 'toolbar.sttSettings.selectDefaultReadLanguage'
            }));
        }
    }, [ dispatch, readLanguages, defaultReadLanguage, onSubmit ]);

    // Format selected languages for display
    const speakLanguagesDisplay = selectedSpeakLanguages.length > 0
        ? selectedSpeakLanguages.map(item => item.content).join(', ')
        : '';

    const readLanguagesDisplay = readLanguages.length > 0
        ? readLanguages.map(item => item.content).join(', ')
        : '';

    const defaultReadLanguageDisplay = defaultReadLanguage ? defaultReadLanguage.content : '';

    return (
        <Dialog
            ok = {{
                translationKey: 'dialog.Ok'
            }}
            onSubmit = { onSubmit }
            titleKey = 'toolbar.sttSettings.title'>
            <div className = { classes.controlRow }>
                <label
                    className = { classes.switchLabel }
                    htmlFor = 'stt-subtitle-visibility-switch'>
                    {t('toolbar.accessibilityLabel.sttShowSubtitles')}
                </label>
                <Switch
                    checked = { subtitleVisible }
                    id = 'stt-subtitle-visibility-switch'
                    onChange = { onSubtitleVisibilityToggle } />
            </div>
            <div className = { classes.selectContainer }>
                <div className = { classes.labelRow }>
                    <label
                        className = { classes.label }
                        htmlFor = 'stt-speak-languages'>
                        {t('toolbar.sttSettings.selectSpeakLanguages')}
                    </label>
                    <Button
                        className = { classes.selectButton }
                        label = 'Select'
                        onClick = { onOpenSpeakLanguagesDialog }
                        size = 'small'
                        type = 'secondary' />
                </div>
                <Input
                    id = 'stt-speak-languages'
                    readOnly = { true }
                    value = { speakLanguagesDisplay } />
            </div>
            <div className = { classes.bottomMargin }>
                <div className = { classes.labelRow }>
                    <label
                        className = { classes.label }
                        htmlFor = 'stt-read-language'>
                        {t('toolbar.sttSettings.selectReadLanguage')}
                    </label>
                    <Button
                        className = { classes.selectButton }
                        label = 'Select'
                        onClick = { onOpenReadLanguagesDialog }
                        size = 'small'
                        type = 'secondary' />
                </div>
                <Input
                    id = 'stt-read-language'
                    readOnly = { true }
                    value = { readLanguagesDisplay } />
            </div>
            {readLanguages.length > 0 && (
                <div className = { classes.bottomMargin }>
                    <div className = { classes.labelRow }>
                        <label
                            className = { classes.label }
                            htmlFor = 'stt-default-read-language'>
                            {t('toolbar.sttSettings.selectDefaultReadLanguage')}
                        </label>
                        {readLanguages.length > 1 && (
                            <Button
                                className = { classes.selectButton }
                                label = 'Select'
                                onClick = { onOpenDefaultReadLanguageDialog }
                                size = 'small'
                                type = 'secondary' />
                        )}
                    </div>
                    <Input
                        id = 'stt-default-read-language'
                        readOnly = { true }
                        value = { defaultReadLanguageDisplay } />
                </div>
            )}
        </Dialog>
    );
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        _isSubtitleVisible: isSubtitleVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(STTSettingsDialog));

