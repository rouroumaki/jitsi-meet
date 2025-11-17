import { Theme } from '@mui/material';
import React from 'react';
import { connect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState } from '../../app/types';
import { getVideospaceFloatingElementsBottomSpacing } from '../../base/ui/functions.web';
import {
    getTransitionParamsForElementsAboveToolbox,
    isToolboxVisible,
    toCSSTransitionValue
} from '../../toolbox/functions.web';
import { clearSubtitle } from '../actions';
import { isSTTEnabled, isSubtitleVisible } from '../functions';
import { ILocalSubtitle } from '../reducer';

interface IProps {
    _currentSubtitle: ILocalSubtitle | null;
    _isSTTEnabled: boolean;
    _isSubtitleVisible: boolean;
    _toolboxVisible: boolean;
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;
    dispatch: Function;
}

const styles = (theme: Theme, props: IProps) => {
    const { _toolboxVisible = false } = props;
    const bottom = getVideospaceFloatingElementsBottomSpacing(theme, _toolboxVisible);

    return {
        localSubtitleContainer: {
            bottom: `${bottom + 20}px`,
            left: '50%',
            maxWidth: '60vw',
            pointerEvents: 'none' as const,
            position: 'absolute' as const,
            transform: 'translateX(-50%)',
            zIndex: 7,
            transition: `bottom ${toCSSTransitionValue(getTransitionParamsForElementsAboveToolbox(_toolboxVisible))}`
        },
        subtitleContent: {
            background: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            padding: '8px 16px',
            display: 'flex',
            flexDirection: 'row' as const,
            gap: '8px',
            alignItems: 'center' as const
        },
        participantName: {
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold' as const,
            opacity: 0.9,
            whiteSpace: 'nowrap' as const
        },
        subtitleText: {
            color: '#fff',
            fontSize: '18px',
            lineHeight: 1.4,
            overflowWrap: 'break-word' as const,
            textShadow: `
                0px 0px 1px rgba(0,0,0,0.3),
                0px 1px 1px rgba(0,0,0,0.3),
                1px 0px 1px rgba(0,0,0,0.3),
                0px 0px 1px rgba(0,0,0,0.3)`
        },
        interim: {
            opacity: 0.7
        }
    };
};

/**
 * React component that displays local STT subtitles at the bottom of the screen.
 */
class LocalSubtitleDisplay extends React.Component<IProps> {
    private _clearSubtitleTimer: number | null = null;
    private readonly _SUBTITLE_TIMEOUT_MS = 5000; // 5 seconds

    /**
     * Lifecycle method that runs after the component mounts.
     *
     * @returns {void}
     */
    override componentDidMount() {
        this._checkAndSetTimer();
    }

    /**
     * Lifecycle method that runs after the component updates.
     *
     * @param {IProps} prevProps - The previous props.
     * @returns {void}
     */
    override componentDidUpdate(prevProps: IProps) {
        const { _currentSubtitle } = this.props;
        const prevSubtitle = prevProps._currentSubtitle;

        // If subtitle changed, reset the timer
        if (_currentSubtitle?.timestamp !== prevSubtitle?.timestamp) {
            this._checkAndSetTimer();
        }
    }

    /**
     * Lifecycle method that runs before the component unmounts.
     *
     * @returns {void}
     */
    override componentWillUnmount() {
        this._clearTimer();
    }

    /**
     * Checks if subtitle exists and sets/clears the timer accordingly.
     *
     * @returns {void}
     */
    _checkAndSetTimer() {
        this._clearTimer();

        const { _currentSubtitle, _isSTTEnabled, _isSubtitleVisible } = this.props;

        if (!_isSTTEnabled || !_isSubtitleVisible || !_currentSubtitle?.text) {
            return;
        }

        // Set timer to clear subtitle after 5 seconds
        this._clearSubtitleTimer = window.setTimeout(() => {
            this.props.dispatch(clearSubtitle());
            this._clearSubtitleTimer = null;
        }, this._SUBTITLE_TIMEOUT_MS);
    }

    /**
     * Clears the subtitle timer if it exists.
     *
     * @returns {void}
     */
    _clearTimer() {
        if (this._clearSubtitleTimer !== null) {
            clearTimeout(this._clearSubtitleTimer);
            this._clearSubtitleTimer = null;
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { _currentSubtitle, _isSTTEnabled, _isSubtitleVisible } = this.props;

        if (!_isSTTEnabled || !_isSubtitleVisible || !_currentSubtitle?.text) {
            return null;
        }

        const classesObj = withStyles.getClasses(this.props);
        const { participantName, text, isInterim } = _currentSubtitle;

        return (
            <div className = { classesObj.localSubtitleContainer }>
                <div className = { `${classesObj.subtitleContent} ${isInterim ? classesObj.interim : ''}` }>
                    <div className = { classesObj.participantName }>
                        { participantName }:
                    </div>
                    <div className = { classesObj.subtitleText }>
                        { text }
                    </div>
                </div>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated component's props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    return {
        _currentSubtitle: state['features/stt'].currentSubtitle,
        _isSTTEnabled: isSTTEnabled(state),
        _isSubtitleVisible: isSubtitleVisible(state),
        _toolboxVisible: isToolboxVisible(state)
    };
}

export default connect(mapStateToProps)(withStyles(LocalSubtitleDisplay, styles));

