// src/components/RegistrationMessage.tsx
'use client';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegistrationMessage() {
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        if (registered === 'true') {
            setShowMessage(true);
            window.history.replaceState({}, '', '/');
            const timer = setTimeout(() => setShowMessage(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [registered]);
    if (!showMessage) return null;

    return (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-lg shadow-lg p-6 max-w-md w-full z-50">
            <div className="flex items-center justify-between">
                <p className="text-lg text-gray-800">
                    Registration successful. Please log in using the button in the top right.
                </p>
                <button
                    onClick={() => setShowMessage(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl ml-4"
                >
                    ×
                </button>
            </div>
        </div>
    );
}