// src/components/SessionTimeout.tsx
'use client';
import { useEffect } from 'react';
import { signOut,useSession } from 'next-auth/react';

import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours in ms
const WARNING_TIME = 60 * 1000; // 1 minute before timeout

export default function SessionTimeout() {
    const { data: session } = useSession();
    useEffect(() => {
        if (!session) return;
        let timeoutId: NodeJS.Timeout | null = null;
        let warningId: NodeJS.Timeout | null = null;

        const resetTimer = () => {
            // Clear any existing timers
            if (timeoutId) clearTimeout(timeoutId);
            if (warningId) clearTimeout(warningId);

            //set warning 1 minutes before timeout
            warningId = setTimeout(() => {
                toast.warning('You will be logged out soon due to inactivity.', {
                    duration: 60000,
                });
            }, INACTIVITY_TIMEOUT - WARNING_TIME);

            //set actual timeout
            timeoutId = setTimeout(() => {
                signOut({ callbackUrl: '/' });
            }, INACTIVITY_TIMEOUT);
        };

        // Reset on user activity
        const events = ['mousemove', 'keydown', 'mousedown', 'scroll', 'touchstart'];
        events.forEach(event => window.addEventListener(event, resetTimer));

        // Start the timer immediately
        resetTimer();

        // Cleanup on unmount or session change
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (warningId) clearTimeout(warningId);
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [session]);

    return null;
}