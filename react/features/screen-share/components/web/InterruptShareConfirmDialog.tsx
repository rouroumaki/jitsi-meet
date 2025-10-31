import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { getLocalParticipant, getParticipantById } from '../../../base/participants/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { startScreenShareFlow } from '../../actions.web';
import { sendForceStopScreenShare } from '../../signals';

interface IProps extends WithTranslation {
    /** 注入自 props/state 的显示名 */
    _sharerName?: string;
    dispatch: IStore['dispatch'];

    sharerId: string;
}

class InterruptShareConfirmDialog extends Component<IProps> {
    constructor(props: IProps) {
        super(props);

        this._onConfirm = this._onConfirm.bind(this);
    }

    _onConfirm() {
        const { dispatch, sharerId } = this.props;

        // 发送强制停止给当前共享者，然后立即开始本地屏幕共享
        dispatch(sendForceStopScreenShare(sharerId));
        dispatch(startScreenShareFlow(true));

        return true;
    }

    override render() {
        const { t, _sharerName } = this.props;
        const title = t('dialog.confirm');
        const description = t('screenshare.interruptConfirm', { name: _sharerName || '' });

        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.Cancel' }}
                ok = {{ translationKey: 'dialog.Continue' }}
                onSubmit = { this._onConfirm }
                titleKey = { title }>
                <div className = 'interrupt-share-confirm-dialog'>
                    <p className = 'description'>{ description }</p>
                </div>
            </Dialog>
        );
    }
}

function _mapStateToProps(state: IReduxState, ownProps: { sharerId: string; }) {
    const sharer = getParticipantById(state, ownProps.sharerId);
    const local = getLocalParticipant(state);

    return {
        _sharerName: sharer?.name || (sharer?.id === local?.id ? state['features/base/config']?.defaultLocalDisplayName : undefined)
    };
}

export default translate(connect(_mapStateToProps)(InterruptShareConfirmDialog));

