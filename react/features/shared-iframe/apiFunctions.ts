import { doGetJSON } from '../base/util/httpUtils';

import { CHECK_USER_IS_ROOM_OWNER_API_URL, PEERTIME_API_URL } from './apiConstants';

/**
 * 获取用户登录信息.
 *
 * @param {string} userToken - 用户token.
 * @returns {Promise<Object>} 返回包含ClassRoomID和Name的用户信息.
 */
export async function getUserLoginInfo(userToken: string): Promise<{ [key: string]: any; ClassRoomID?: string;Name?: string; }> {
    try {
        const result = await doGetJSON(PEERTIME_API_URL, false, {
            headers: {
                UserToken: userToken
            }
        });

        if (result.RetCode !== 0) {
            throw new Error(result.ErrorMessage || 'Failed to get user login info');
        }

        return result.RetData || {};
    } catch (error) {
        console.error('Failed to get user login info:', error);
        throw error;
    }
}

/**
 * 检查用户是否为房间的owner.
 * 通过比较ClassRoomID和房间号来判断.
 * 如果roomName不包含字母，则通过API检查RoleInLesson字段.
 *
 * @param {string} roomName - 房间号.
 * @returns {Promise<boolean>} 如果用户是房间owner返回true，否则返回false.
 */
export async function checkIfUserIsRoomOwner(roomName: string): Promise<boolean> {
    if (!roomName || typeof window === 'undefined') {
        return false;
    }

    try {
        // 检查roomName是否包含字母
        const containsLetter = /[a-zA-Z]/.test(roomName);

        // 如果不包含字母，调用API检查RoleInLesson
        if (!containsLetter) {
            try {
                const token = window.localStorage.getItem('KloudUserToken') || window.sessionStorage.getItem('UserToken');
                const apiUrl = `${CHECK_USER_IS_ROOM_OWNER_API_URL}?lessonID=${encodeURIComponent(roomName)}`;

                const options: any = {};

                if (token) {
                    options.headers = {
                        UserToken: token
                    };
                }

                const result = await doGetJSON(apiUrl, false, options);

                // 检查RoleInLesson字段，如果是2或5，则返回true
                if (result.RetData && (result.RetData.RoleInLesson === 2 || result.RetData.RoleInLesson === 5)) {
                    return true;
                }

                return false;
            } catch (error) {
                // API调用失败，降级到原有逻辑
                console.warn('Failed to check RoleInLesson from API:', error);

                return false;
            }
        }

        // 先从localStorage获取KloudClassRoomID
        let classRoomID: string | null = window.localStorage.getItem('KloudClassRoomID') || window.sessionStorage.getItem('UserData.ClassRoomID');

        // 如果没有ClassRoomID，尝试从token获取
        if (!classRoomID) {
            const token = window.localStorage.getItem('KloudUserToken') || window.sessionStorage.getItem('UserToken');

            if (token) {
                try {
                    const userInfo = await getUserLoginInfo(token);

                    classRoomID = userInfo.ClassRoomID || null;

                    // 如果获取到了ClassRoomID，保存到localStorage
                    if (classRoomID) {
                        window.localStorage.setItem('KloudClassRoomID', classRoomID);
                    }
                } catch (error) {
                    // API调用失败，降级到原有逻辑
                    console.warn('Failed to get ClassRoomID from API:', error);

                    return false;
                }
            } else {
                // 没有token，无法判断
                return false;
            }
        }

        // 完全匹配比较
        return classRoomID?.toLowerCase() === roomName.toLowerCase();
    } catch (error) {
        // 任何错误都返回false，降级到原有逻辑
        console.warn('Error checking if user is room owner:', error);

        return false;
    }
}

/**
 * 检查会议是否为 livesyncCall 模式.
 * 如果roomName不包含字母，则通过API检查Category字段.
 *
 * @param {string} roomName - 房间号.
 * @returns {Promise<boolean>} 如果是livesyncCall模式返回true，否则返回false.
 */
export async function checkIfLivesyncCall(roomName: string): Promise<boolean> {
    if (!roomName || typeof window === 'undefined') {
        return false;
    }

    try {
        // 检查roomName是否包含字母
        const containsLetter = /[a-zA-Z]/.test(roomName);

        // 如果不包含字母，调用API检查Category
        if (!containsLetter) {
            try {
                const token = window.localStorage.getItem('KloudUserToken') || window.sessionStorage.getItem('UserToken');
                const apiUrl = `${CHECK_USER_IS_ROOM_OWNER_API_URL}?lessonID=${encodeURIComponent(roomName)}`;

                const options: any = {};

                if (token) {
                    options.headers = {
                        UserToken: token
                    };
                }

                const result = await doGetJSON(apiUrl, false, options);

                // 检查Category字段，如果是15，则返回true
                if (result.RetData && result.RetData.Category === 15) {
                    return true;
                }

                return false;
            } catch (error) {
                // API调用失败，返回false
                console.warn('Failed to check Category from API:', error);

                return false;
            }
        }

        // 如果包含字母，不是livesyncCall模式
        return false;
    } catch (error) {
        // 任何错误都返回false
        console.warn('Error checking if livesyncCall:', error);

        return false;
    }
}

