// src/app/history/ClientHistory.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ClientHistory({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh(); // Soft refresh — keeps scroll position
        }, 15000); // Every 15 seconds
        return () => clearInterval(interval);
    }, [router]);

    return <>{children}</>;
}