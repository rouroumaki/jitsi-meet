/**
 * 第三方 SDK 接口定义（需要根据实际 SDK 进行修改）.
 */
export interface ISTTSDK {
    start: (deviceId: string) => Promise<void>;
    stop: () => Promise<void>;
}

