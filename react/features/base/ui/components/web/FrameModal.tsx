import React from 'react';
import { useDispatch } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { hideDialog } from '../../../dialog/actions';
import { IconCloseLarge } from '../../../icons/svg';

import BaseDialog from './BaseDialog';
import ClickableIcon from './ClickableIcon';

interface IProps {
    children?: React.ReactNode;
    disableBackdropClose?: boolean;
    hideCloseButton?: boolean;
    size?: 'large' | 'medium';
    title?: string;
}

const useStyles = makeStyles()(() => ({
    modalTransparent: {
        backgroundColor: 'transparent !important',
        border: 'none !important',
        boxShadow: 'none !important',
        padding: 0,
    },
    closeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 2,
    },
    content: {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
    },
}));

export default function FrameModal(props: IProps) {
    const dispatch = useDispatch();
    const { classes } = useStyles();

    const { children, disableBackdropClose, hideCloseButton, size, title } = props;

    const resolvedSize = size ?? 'medium';
    const resolvedDisableBackdropClose = disableBackdropClose ?? true;

    const onClose = () => dispatch(hideDialog());

    return (
        <BaseDialog
            className = { classes.modalTransparent }
            disableBackdropClose = { resolvedDisableBackdropClose }
            disableEnter = { true }
            disableEscape = { true }
            onClose = { onClose }
            size = { resolvedSize }
            title = { title }>
            {!hideCloseButton && (
                <div className = { classes.closeButton }>
                    <ClickableIcon
                        accessibilityLabel = 'Close'
                        icon = { IconCloseLarge }
                        onClick = { onClose } />
                </div>
            )}
            <div className = { classes.content }>{children}</div>
        </BaseDialog>
    );
}
