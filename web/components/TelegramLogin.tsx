'use client';

import { useEffect, useRef } from 'react';

type TelegramUser = {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    auth_date: number;
    hash: string;
};

type TelegramLoginProps = {
    botName: string;
    onAuth: (user: TelegramUser) => void;
    buttonSize?: 'large' | 'medium' | 'small';
    cornerRadius?: number;
    requestAccess?: boolean;
};

declare global {
    interface Window {
        onTelegramAuth: (user: TelegramUser) => void;
    }
}

export function TelegramLogin({
    botName,
    onAuth,
    buttonSize = 'large',
    cornerRadius,
    requestAccess = true
}: TelegramLoginProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        window.onTelegramAuth = (user: TelegramUser) => {
            onAuth(user);
        };

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', buttonSize);
        if (cornerRadius !== undefined) {
            script.setAttribute('data-radius', cornerRadius.toString());
        }
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', requestAccess ? 'write' : '');
        script.async = true;

        if (containerRef.current) {
            containerRef.current.appendChild(script);
        }

        return () => {
            // Clean up if necessary
            if (containerRef.current) {
                containerRef.current.innerHTML = '';
            }
        };
    }, [botName, buttonSize, cornerRadius, requestAccess, onAuth]);

    return <div ref={containerRef} className="flex justify-center py-2" />;
}
