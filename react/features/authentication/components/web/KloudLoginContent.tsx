import React, { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { hideDialog } from '../../../base/dialog/actions';

export default function KloudLoginContent() {
    const dispatch = useDispatch();
    const frameRef = useRef<HTMLIFrameElement | null>(null);

    useEffect(() => {
        function onMessage(e: MessageEvent) {
            try {
                const allowedOrigins = [ 'https://kloud.cn' ];

                if (!allowedOrigins.includes(e.origin)) {
                    return;
                }

                const data = e.data as any;

                if (data && typeof data === 'object' && data.type === 'login-info') {
                    localStorage.setItem('KloudUserName', data.data.Name);
                    localStorage.setItem('KloudUserToken', data.data.UserToken);
                    window.dispatchEvent(new CustomEvent('kloud-login-updated'));
                    dispatch(hideDialog());
                }
            } catch (_err) {
                // ignore
            }
        }

        window.addEventListener('message', onMessage);

        return () => window.removeEventListener('message', onMessage);
    }, [ dispatch ]);

    return (
        <div style = {{ width: '100%', height: '60vh' }}>
            <iframe
                allow = { 'fullscreen *; autoplay *' }
                ref = { frameRef }
                sandbox = { 'allow-scripts allow-forms allow-popups allow-pointer-lock allow-same-origin' }
                src = { 'https://kloud.cn/plugin/livesync/login' }
                style = {{ width: '100%', height: '100%', border: 'none' }} />
        </div>
    );
}
