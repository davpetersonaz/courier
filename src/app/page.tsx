// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-800 mb-6">SpeedyCourier</h1>
                <p className="text-xl text-gray-600 mb-12">
                    Schedule your pickups and dropoffs with ease.
                </p>

                <Link href="/schedule"
                    className="inline-block bg-blue-500 text-white px-8 py-4 text-lg rounded-md hover:bg-blue-600 transition"
                >
                    Get Started
                </Link>
            </div>
        </div>
    );
}