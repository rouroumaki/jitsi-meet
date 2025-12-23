import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import Avatar from '../../../base/avatar/components/Avatar';
import { openDialog } from '../../../base/dialog/actions';
import Icon from '../../../base/icons/components/Icon';
import { IconArrowRight } from '../../../base/icons/svg';
import { getDominantSpeakerParticipant, getLocalParticipant, getParticipantById, getParticipantCountForDisplay } from '../../../base/participants/functions';
import Tooltip from '../../../base/tooltip/components/Tooltip';
import SpeakerStats from '../../../speaker-stats/components/web/SpeakerStats';
import { isSpeakerStatsDisabled } from '../../../speaker-stats/functions';

const useStyles = makeStyles()(() => {
    return {
        container: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff',
            borderRadius: '99999px',
            padding: '6px',
            cursor: 'pointer',
            height: 28,
            boxSizing: 'border-box'
        },
        icon: {
            display: 'flex',
            alignItems: 'center'
        },
        avatar: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            overflow: 'hidden',
            flexShrink: 0
        },
        text: {
            fontSize: '14px',
            color: '#000',
            fontWeight: 500
        }
    };
});

/**
 * ParticipantsCount react component.
 * Displays the number of participants and opens Speaker stats on click.
 *
 * @class ParticipantsCount
 */
function SpeakerStatsLabel() {
    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const count = useSelector(getParticipantCountForDisplay);
    const _isSpeakerStatsDisabled = useSelector(isSpeakerStatsDisabled);

    // 获取要显示的参会者：优先使用 dominantSpeaker，如果不存在则使用第一个参会者
    const displayParticipant = useSelector((state: IReduxState) => {
        const dominantSpeaker = getDominantSpeakerParticipant(state);

        if (dominantSpeaker) {
            return dominantSpeaker;
        }

        // 获取第一个远程参会者
        const { sortedRemoteParticipants, remote } = state['features/base/participants'];

        if (sortedRemoteParticipants.size > 0) {
            const firstParticipantId = Array.from(sortedRemoteParticipants.keys())[0];

            return getParticipantById(state, firstParticipantId);
        }

        // 如果 remote Map 有值，获取第一个
        if (remote.size > 0) {
            const firstParticipant = Array.from(remote.values())[0];

            return firstParticipant;
        }

        // 最后尝试获取本地参会者
        return getLocalParticipant(state);
    });

    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { classes } = useStyles();

    const onClick = useCallback(() => {
        dispatch(openDialog(SpeakerStats, { conference }));
    }, [ dispatch, conference ]);

    const onKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onClick();
        }
    }, [ onClick ]);

    if (count <= 1 || _isSpeakerStatsDisabled) {
        return null;
    }

    return (
        <Tooltip
            content = { t('speakerStats.labelTooltip', { count }) }
            position = { 'bottom' }>
            <div
                className = { classes.container }
                onClick = { onClick }
                onKeyDown = { onKeyDown }
                role = 'button'
                tabIndex = { 0 }>
                <div className = { classes.avatar }>
                    <Avatar
                        participantId = { displayParticipant?.id }
                        size = { 16 } />
                </div>
                <span className = { classes.text }>{count}</span>
                <Icon
                    className = { classes.icon }
                    color = '#000'
                    size = { 16 }
                    src = { IconArrowRight } />
            </div>
        </Tooltip>
    );
}

export default SpeakerStatsLabel;
