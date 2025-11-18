import React, { useCallback, useEffect, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { translate } from '../../base/i18n/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { MultiSelectItem } from '../../base/ui/components/types';
import Dialog from '../../base/ui/components/web/Dialog';
import MultiSelect from '../../base/ui/components/web/MultiSelect';
import Select from '../../base/ui/components/web/Select';

const STORAGE_KEY = 'stt-language-settings';

interface IProps extends WithTranslation {
    dispatch?: Function;
}

const useStyles = makeStyles()(theme => {
    return {
        selectContainer: {
            display: 'flex',
            flexDirection: 'column',
            marginBottom: theme.spacing(4),
        },
        label: {
            color: theme.palette.text01,
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            marginBottom: theme.spacing(2)
        },
        bottomMargin: {
            marginBottom: theme.spacing(2)
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
        readLanguage: 'zh'
    };
}

/**
 * Saves settings to localStorage.
 *
 * @param {Object} settings - The settings to save.
 * @returns {void}
 */
function saveSettings(settings: { readLanguage: string; speakLanguages: string[]; }) {
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
function STTSettingsDialog({ t }: IProps) {
    const { classes } = useStyles();
    const [ filterValue, setFilterValue ] = useState('');
    const [ isMultiSelectOpen, setIsMultiSelectOpen ] = useState(false);
    const [ readLanguage, setReadLanguage ] = useState('zh');
    const [ selectedSpeakLanguages, setSelectedSpeakLanguages ] = useState<MultiSelectItem[]>([]);

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

        setReadLanguage(savedSettings.readLanguage || 'zh');
        setSelectedSpeakLanguages(savedSpeakLanguages);
    }, [ getAvailableLanguages ]);

    /**
     * Handles filter value change for multi-select.
     *
     * @param {string} value - The new filter value.
     * @returns {void}
     */
    const onFilterChange = useCallback((value: string) => {
        setFilterValue(value);
        setIsMultiSelectOpen(true);
    }, []);

    /**
     * Handles input focus to show available options.
     *
     * @returns {void}
     */
    const onInputFocus = useCallback(() => {
        setIsMultiSelectOpen(true);
    }, []);

    /**
     * Handles clicking outside to close the dropdown.
     *
     * @returns {void}
     */
    const onInputBlur = useCallback(() => {
        // Delay closing to allow item selection
        setTimeout(() => {
            setIsMultiSelectOpen(false);
        }, 200);
    }, []);

    /**
     * Handles selection of an item in multi-select.
     *
     * @param {MultiSelectItem} item - The selected item.
     * @returns {void}
     */
    const onMultiSelectItemSelected = useCallback((item: MultiSelectItem) => {
        // Check if already selected
        if (selectedSpeakLanguages.find(lang => lang.value === item.value)) {
            return;
        }

        setSelectedSpeakLanguages([ ...selectedSpeakLanguages, item ]);
        setFilterValue('');
        setIsMultiSelectOpen(false);
    }, [ selectedSpeakLanguages ]);

    /**
     * Handles removal of an item from multi-select.
     *
     * @param {MultiSelectItem} item - The item to remove.
     * @returns {void}
     */
    const onMultiSelectItemRemoved = useCallback((item: MultiSelectItem) => {
        setSelectedSpeakLanguages(selectedSpeakLanguages.filter(lang => lang.value !== item.value));
    }, [ selectedSpeakLanguages ]);

    /**
     * Handles read language change.
     *
     * @param {ChangeEvent<HTMLSelectElement>} e - The change event.
     * @returns {void}
     */
    const onReadLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setReadLanguage(e.target.value);
    }, []);

    /**
     * Handles form submission.
     *
     * @returns {void}
     */
    const onSubmit = useCallback(() => {
        const settings = {
            speakLanguages: selectedSpeakLanguages.map(item => item.value),
            readLanguage
        };

        saveSettings(settings);
    }, [ selectedSpeakLanguages, readLanguage ]);

    const availableLanguages = getAvailableLanguages();

    // Filter available languages based on filter value and exclude already selected
    // When dropdown is open, show all available languages (filtered by input if any)
    const filteredLanguages = isMultiSelectOpen ? availableLanguages.filter(item => {
        const matchesFilter = !filterValue || item.content.toLowerCase().includes(filterValue.toLowerCase());
        const notSelected = !selectedSpeakLanguages.find(selected => selected.value === item.value);

        return matchesFilter && notSelected;
    }) : [];

    return (
        <Dialog
            ok = {{
                translationKey: 'dialog.Ok'
            }}
            onSubmit = { onSubmit }
            titleKey = 'toolbar.sttSettings.title'>
            <div className = { classes.selectContainer }>
                <label
                    className = { classes.label }
                    htmlFor = 'stt-speak-languages'>
                    {t('toolbar.sttSettings.selectSpeakLanguages')}
                </label>
                <MultiSelect
                    filterValue = { filterValue }
                    id = 'stt-speak-languages'
                    isOpen = { isMultiSelectOpen }
                    items = { filteredLanguages }
                    noMatchesText = { t('toolbar.sttSettings.noLanguagesFound') }
                    onBlur = { onInputBlur }
                    onFilterChange = { onFilterChange }
                    onFocus = { onInputFocus }
                    onRemoved = { onMultiSelectItemRemoved }
                    onSelected = { onMultiSelectItemSelected }
                    placeholder = { t('toolbar.sttSettings.selectSpeakLanguages') }
                    selectedItems = { selectedSpeakLanguages } />
            </div>
            <div className = { classes.bottomMargin }>
                <Select
                    id = 'stt-read-language'
                    label = { t('toolbar.sttSettings.selectReadLanguage') }
                    onChange = { onReadLanguageChange }
                    options = { availableLanguages.map(item => ({
                        label: item.content,
                        value: item.value
                    })) }
                    value = { readLanguage } />
            </div>
        </Dialog>
    );
}

export default translate(connect()(STTSettingsDialog));

