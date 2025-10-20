import React, { useCallback } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { hideDialog } from '../../../base/dialog/actions';
import { translate } from '../../../base/i18n/functions';
import VideoTrack from '../../../base/media/components/web/VideoTrack';
import { pinParticipant } from '../../../base/participants/actions';
import { getParticipantById, isLocalParticipantModerator } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import { getVideoTrackByParticipant } from '../../../base/tracks/functions';
import { ITrack } from '../../../base/tracks/types';
import Button from '../../../base/ui/components/web/Button';
import Dialog from '../../../base/ui/components/web/Dialog';
import { togglePinStageParticipant } from '../../actions';
import { isStageFilmstripAvailable } from '../../functions';

interface IProps extends WithTranslation {
    _isCurrentlyOnLargeVideo: boolean;
    _isLocalParticipantModerator: boolean;
    _participant?: IParticipant;
    _stageFilmstripLayout: boolean;
    _videoTrack?: ITrack;
    dispatch: IStore['dispatch'];
    participantId: string;
}

const useStyles = makeStyles()(theme => {
    return {
        videoContainer: {
            width: '100%',
            height: '400px',
            backgroundColor: theme.palette.ui02,
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
        },
        video: {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        },
        avatar: {
            flexShrink: 0
        },
        name: {
            ...theme.typography.bodyShortBold,
            color: theme.palette.text01,
            marginBottom: '4px'
        },
        status: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.text02
        },
        actionButtons: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            marginTop: '16px'
        },
        actionButton: {
            width: '100%'
        },
        infoText: {
            color: theme.palette.text02,
            textAlign: 'center' as const,
            marginTop: '8px'
        }
    };
});

/**
 * Dialog component that displays a participant's video stream and basic information.
 *
 * @param {IProps} props - The component props.
 * @returns {ReactElement}
 */
function ParticipantVideoDialog({
    _participant,
    _videoTrack,
    _isLocalParticipantModerator,
    _isCurrentlyOnLargeVideo,
    _stageFilmstripLayout,
    dispatch,
    t
}: IProps) {
    const { classes } = useStyles();

    if (!_participant) {
        return null;
    }

    const { name, displayName, id, pinned } = _participant;
    const participantName = displayName || name || t('participant.unknown');

    const handlePinParticipant = useCallback(() => {
        if (_stageFilmstripLayout) {
            dispatch(togglePinStageParticipant(id));
        } else {
            dispatch(pinParticipant(pinned ? null : id));
        }
        dispatch(hideDialog());
    }, [ dispatch, _stageFilmstripLayout, id, pinned ]);

    const renderActionButtons = () => {
        if (_isLocalParticipantModerator) {
            return (
                <div className = { classes.actionButtons }>
                    <Button
                        className = { classes.actionButton }
                        labelKey = { _isCurrentlyOnLargeVideo
                            ? 'filmstrip.participantVideoDialog.unpinParticipant'
                            : 'filmstrip.participantVideoDialog.pinParticipant' }
                        onClick = { handlePinParticipant }
                        type = 'primary' />
                </div>
            );
        }

        return (
            <div className = { classes.infoText }>
                {t('filmstrip.participantVideoDialog.moderatorOnly')}
            </div>
        );
    };

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            size = 'large'
            title = { t('filmstrip.participantVideoDialog.title', { participantName }) }>
            <div className = { classes.videoContainer }>
                {_videoTrack ? (
                    <VideoTrack
                        className = { classes.video }
                        videoTrack = { _videoTrack } />
                ) : (
                    <Avatar
                        className = { classes.avatar }
                        participantId = { _participant.id }
                        size = { 120 } />
                )}
            </div>
            {renderActionButtons()}
        </Dialog>
    );
}

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { participantId } = ownProps;
    const participant = getParticipantById(state, participantId);
    const videoTrack = participant ? getVideoTrackByParticipant(state, participant) : undefined;
    const largeVideoParticipantId = state['features/large-video']?.participantId;
    const isCurrentlyOnLargeVideo = participant?.id === largeVideoParticipantId;

    return {
        _participant: participant,
        _videoTrack: videoTrack,
        _isLocalParticipantModerator: isLocalParticipantModerator(state),
        _isCurrentlyOnLargeVideo: isCurrentlyOnLargeVideo,
        _stageFilmstripLayout: isStageFilmstripAvailable(state)
    };
}

export default translate(connect(_mapStateToProps)(ParticipantVideoDialog));
