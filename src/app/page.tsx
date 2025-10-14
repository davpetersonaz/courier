// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-6">Courier App</h1>
                <p className="text-xl text-gray-600">Schedule your pickups and dropoffs with ease.</p>
                <div className="mt-8">
                    <Link
                        href="/schedule"
                        className="inline-block bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </div>
    );
}