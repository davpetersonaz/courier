// src/app/page.tsx
'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Home() {
    const searchParams = useSearchParams();
    const registered = searchParams.get('registered');
    const [showMessage, setShowMessage] = useState(false);

    useEffect(() => {
        if (registered === 'true') {
            setShowMessage(true);
            // Clean URL after showing message
            window.history.replaceState({}, '', '/');
            // Auto-hide after 6 seconds
            const timer = setTimeout(() => setShowMessage(false), 6000);
            return () => clearTimeout(timer);
        }
    }, [registered]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-6">Courier App</h1>
                <p className="text-xl text-gray-600">Schedule your pickups and dropoffs with ease.</p>
                <div className="mt-8">
                    <Link href="/schedule"
                        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition"
                    >
                        Get Started
                    </Link>
                </div>
                {/* Registration success message */}
                {showMessage && (
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
                )}
            </div>
        </div>
    );
}