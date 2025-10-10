import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconLivedoc } from '../../../base/icons/svg';
import { getLocalParticipant } from '../../../base/participants/functions';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import { showSharedIframeDialog, startSharedIframe, stopSharedIframe } from '../../actions';

interface IProps extends AbstractButtonProps {
    _isActive: boolean;
    _localParticipant: any;
}

class SharedIframeButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'Share livedoc';
    override toggledAccessibilityLabel = 'Stop sharing livedoc';
    override icon = IconLivedoc;
    override label = 'Share livedoc';
    override toggledLabel = 'Stop sharing livedoc';
    override tooltip = 'Share livedoc';
    override toggledTooltip = 'Stop sharing livedoc';

    override async _handleClick() {
        if (this.props._isActive) {
            this.props.dispatch(stopSharedIframe());
        } else {
            this.props.dispatch(startSharedIframe('https://kloud.cn/GoogleMeet/MainStage/1234567890/0'));
            // this.props.dispatch(
            //     showSharedIframeDialog(async (url: string) => {
            //         try {
            //             // 启动共享iframe
            //             this.props.dispatch<any>(
            //                 // @ts-ignore
            //                 require("../../actions").startSharedIframe(url)
            //             );
            //         } catch (error) {
            //             console.error("创建匿名会议失败:", error);
            //             // 这里可以添加用户提示，比如显示错误消息
            //             alert("创建匿名会议失败，请重试");
            //         }
            //     })
            // );
        }
    }

    override _isToggled() {
        return this.props._isActive;
    }
}

function _mapStateToProps(state: IReduxState) {
    return {
        _isActive: Boolean(state['features/shared-iframe']?.active),
        _localParticipant: getLocalParticipant(state),
    };
}

export default translate(connect(_mapStateToProps)(SharedIframeButton));
