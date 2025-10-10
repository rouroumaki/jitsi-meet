import { IJitsiConference } from '../base/conference/reducer';

import { SHARED_IFRAME } from './constants';

// 生成UUID的函数
function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;

        return v.toString(16);
    });
}

// 从localStorage获取或生成新的KloudAnonymousSyncroomID
export function getOrCreateKloudAnonymousSyncroomID(): string {
    const storageKey = 'KloudAnonymousSyncroomID';
    let guid = localStorage.getItem(storageKey);

    if (!guid) {
        guid = generateUUID();
        localStorage.setItem(storageKey, guid);
    }

    return guid;
}

// 调用API创建或更新匿名账户
export async function createOrUpdateInstantAccount(userName: string): Promise<string> {
    const guid = getOrCreateKloudAnonymousSyncroomID();

    try {
        const response = await fetch('https://api.peertime.cn/peertime/V1/User/CreateOrUpdateInstantAccout4Syncroom', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                Guid: guid,
                UserName: userName,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        return result.RetData.Account.UserToken;
    } catch (error) {
        console.error('创建匿名账户失败:', error);
        throw error;
    }
}

export function sendSharedIframeCommand({
    conference,
    localParticipantId = '',
    status,
    url,
    token,
}: {
    conference?: IJitsiConference;
    localParticipantId?: string;
    status: string;
    token?: string;
    url?: string;
}) {
    conference?.sendCommandOnce(SHARED_IFRAME, {
        value: url ?? '',
        attributes: {
            from: localParticipantId,
            state: status,
            token,
        },
    });
}

export async function createLivedocInstance({
    userToken,
    jitsiInstanceId,
}: {
    jitsiInstanceId: string;
    userToken: string;
}) {
    try {
        const response = await fetch('https://wss.peertime.cn/MeetingServer/jitsi/create_meeting_instance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                UserToken: userToken,
            },
            body: JSON.stringify({
                jitsiInstanceId: jitsiInstanceId,
                companyId: 3255
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        return result.data;
    } catch (error) {
        console.error('创建livedoc实例失败:', error);
        throw error;
    }
}
