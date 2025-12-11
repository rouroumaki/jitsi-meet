import React, { useCallback, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../base/dialog/actions';
import { translate } from '../../base/i18n/functions';
import { withPixelLineHeight } from '../../base/styles/functions.web';
import { MultiSelectItem } from '../../base/ui/components/types';
import Checkbox from '../../base/ui/components/web/Checkbox';
import Dialog from '../../base/ui/components/web/Dialog';

interface IProps extends WithTranslation {
    availableLanguages: MultiSelectItem[];
    onConfirm: (selectedLanguages: MultiSelectItem[]) => void;
    onCancel?: () => void;
    selectedLanguages: MultiSelectItem[];
    singleSelect?: boolean;
    titleKey?: string;
}

const useStyles = makeStyles()(theme => {
    return {
        languageList: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(3),
            marginTop: theme.spacing(2)
        },
        checkboxItem: {
            display: 'flex',
            alignItems: 'center',
            padding: `${theme.spacing(2)} 0`,
            cursor: 'pointer',
            ...withPixelLineHeight(theme.typography.bodyShortRegular)
        }
    };
});

/**
 * Component that renders a dialog for selecting languages with checkboxes.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
function LanguageSelectDialog({ availableLanguages, onConfirm, onCancel, selectedLanguages, singleSelect = false, titleKey }: IProps) {
    const { classes } = useStyles();
    const dispatch = useDispatch();
    const [ tempSelected, setTempSelected ] = useState<Set<string>>(
        new Set(selectedLanguages.map(item => item.value))
    );
    const [ tempSingleSelected, setTempSingleSelected ] = useState<string>(
        singleSelect && selectedLanguages.length > 0 ? selectedLanguages[0].value : ''
    );

    /**
     * Handles checkbox change.
     *
     * @param {string} value - The language value.
     * @param {React.ChangeEvent<HTMLInputElement>} e - The change event.
     * @returns {void}
     */
    const handleCheckboxChange = useCallback((value: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;

        setTempSelected(prev => {
            const newSet = new Set(prev);

            if (checked) {
                newSet.add(value);
            } else {
                newSet.delete(value);
            }

            return newSet;
        });
    }, []);

    /**
     * Handles radio button change for single select mode.
     *
     * @param {string} value - The language value.
     * @returns {void}
     */
    const handleRadioChange = useCallback((value: string) => {
        setTempSingleSelected(value);
    }, []);

    /**
     * Handles dialog confirmation.
     *
     * @returns {void}
     */
    const handleConfirm = useCallback(() => {
        let selected: MultiSelectItem[];

        if (singleSelect) {
            const selectedItem = availableLanguages.find(item => item.value === tempSingleSelected);
            selected = selectedItem ? [ selectedItem ] : [];
        } else {
            selected = availableLanguages.filter(item => tempSelected.has(item.value));
        }

        onConfirm(selected);
        // Dialog will auto-close via default behavior (disableAutoHideOnSubmit is false by default)
    }, [ availableLanguages, tempSelected, tempSingleSelected, singleSelect, onConfirm ]);

    /**
     * Handles dialog cancellation.
     *
     * @returns {void}
     */
    const handleCancel = useCallback(() => {
        onCancel?.();
        // Dialog will auto-close via default behavior
    }, [ onCancel ]);

    return (
        <Dialog
            cancel = {{
                translationKey: 'dialog.Cancel'
            }}
            ok = {{
                translationKey: 'dialog.Ok'
            }}
            onCancel = { handleCancel }
            onSubmit = { handleConfirm }
            titleKey = { titleKey || 'toolbar.sttSettings.selectLanguages' }>
            <div className = { classes.languageList }>
                {availableLanguages.map(language => (
                    <div
                        className = { classes.checkboxItem }
                        key = { language.value }>
                        {singleSelect ? (
                            <label style = {{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input
                                    checked = { tempSingleSelected === language.value }
                                    name = 'default-read-language'
                                    onChange = { () => handleRadioChange(language.value) }
                                    type = 'radio'
                                    value = { language.value } />
                                <span style = {{ marginLeft: '10px' }}>{language.content}</span>
                            </label>
                        ) : (
                            <Checkbox
                                checked = { tempSelected.has(language.value) }
                                label = { language.content }
                                name = { `language-${language.value}` }
                                onChange = { handleCheckboxChange(language.value) } />
                        )}
                    </div>
                ))}
            </div>
        </Dialog>
    );
}

export default translate(LanguageSelectDialog);
