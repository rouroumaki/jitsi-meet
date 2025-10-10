import { Theme } from '@mui/material';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { keyframes } from 'tss-react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../base/icons/components/Icon';
import { IconCloseLarge, IconLoading } from '../../../base/icons/svg';
import Message from '../../../base/react/components/web/Message';
import { withPixelLineHeight } from '../../../base/styles/functions.web';
import { INotificationProps } from '../../types';

interface IProps extends INotificationProps {

    /**
     * Callback invoked when the user clicks to dismiss the notification.
     */
    onDismissed: Function;
}

const useStyles = makeStyles()((theme: Theme) => {
    return {
        container: {
            background: 'linear-gradient(90deg, #BCBBEB 0%, #FFFFFF 47.12%)',
            padding: '15px',
            display: 'flex',
            position: 'relative' as const,
            borderRadius: `${theme.shape.borderRadius}px`,
            boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.25)',
            alignItems: 'center',
            maxWidth: '320px'
        },

        spinner: {
            color: '#3C3586',
            animation: `${keyframes`
                0% {
                    transform: rotate(0deg);
                }
                100% {
                    transform: rotate(360deg);
                }
            `} 1s linear infinite`,
            marginRight: theme.spacing(2)
        },

        content: {
            display: 'flex',
            alignItems: 'center',
            flex: 1,
            maxWidth: '100%'
        },

        textContainer: {
            display: 'flex',
            flexDirection: 'column' as const,
            color: theme.palette.text04,
            flex: 1,

            // maxWidth: 100% minus the spinner (20px) minus the margin (16px)
            maxWidth: 'calc(100% - 36px)'
        },

        title: {
            ...withPixelLineHeight(theme.typography.bodyShortBold),
            fontWeight: 400
        },

        description: {
            ...withPixelLineHeight(theme.typography.bodyShortRegular),
            overflow: 'auto',
            overflowWrap: 'break-word',
            userSelect: 'all',

            '&:not(:empty)': {
                marginTop: theme.spacing(0.5)
            }
        },

        closeIcon: {
            cursor: 'pointer',
            marginLeft: theme.spacing(1)
        }
    };
});

const LoadingNotification = ({
    description,
    descriptionArguments,
    descriptionKey,
    onDismissed,
    title,
    titleArguments,
    titleKey,
    uid
}: IProps) => {
    const { classes, theme } = useStyles();
    const { t } = useTranslation();

    const onDismiss = useCallback(() => {
        onDismissed(uid);
    }, [ uid, onDismissed ]);

    // eslint-disable-next-line react/no-multi-comp
    const renderDescription = useCallback(() => {
        const descriptionArray: string[] = [];

        descriptionKey
            && descriptionArray.push(t(descriptionKey, descriptionArguments));

        description && typeof description === 'string' && descriptionArray.push(description);

        if (descriptionArray.length === 0) {
            return null;
        }

        return (
            <div
                className = { classes.description }
                data-testid = { descriptionKey } >
                <Message text = { descriptionArray.join(' ') } />
                {typeof description === 'object' && description}
            </div>
        );
    }, [ description, descriptionArguments, descriptionKey, classes ]);

    return (
        <div
            aria-atomic = 'false'
            aria-live = 'polite'
            className = { classes.container }
            data-testid = { titleKey || descriptionKey }
            id = { uid }>
            <div className = { classes.content }>
                <div className = { classes.spinner }>
                    <Icon
                        color = { '#3C3586' }
                        size = { 20 }
                        src = { IconLoading } />
                </div>
                <div className = { classes.textContainer }>
                    <span className = { classes.title }>
                        {title || t(titleKey ?? '', titleArguments)}
                    </span>
                    {renderDescription()}
                </div>
                <Icon
                    className = { classes.closeIcon }
                    color = { theme.palette.icon04 }
                    id = 'close-loading-notification'
                    onClick = { onDismiss }
                    size = { 20 }
                    src = { IconCloseLarge }
                    tabIndex = { 0 }
                    testId = { `${titleKey || descriptionKey}-dismiss` } />
            </div>
        </div>
    );
};

export default LoadingNotification;
