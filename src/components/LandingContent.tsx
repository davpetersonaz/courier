// src/components/LandingHero.tsx
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import LoginModal from './LoginModal';

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
        duration: 0.8,
        ease: "easeOut" as const
    },
    viewport: { once: true, amount: 0.3 }
};


export default function LandingContent() {
    const { data: session, status } = useSession();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const openLogin = () => setIsLoginOpen(true);
    const closeLogin = () => setIsLoginOpen(false);
    // show a brief loader while session is loading (prevents flash)
    if (status === 'loading') {
        return null; // or a minimal spinner if preferred
    }
    const isLoggedIn = !!session;

    return (
        <>
            {/* Hero */}
            <motion.section {...fadeInUp} className="relative h-screen w-full overflow-hidden">
                {/* Background Image - covers entire viewport */}
                <div className="absolute inset-0">
                    <Image
                        src="/images/PhoenixSkyline123.jpg"
                        alt="Courier delivery hero"
                        fill
                        priority // Loads fast for above-the-fold
                        quality={85}
                        className="object-cover brightness-[0.85] scale-105 transition-transform duration-700 hover:scale-110"
                        sizes="100vw"
                    />
                </div>

                {/* Overlay gradient for better text readability */}
                <div className="absolute inset-0 bg-linear-to-b from-black/30 via-black/20 to-black/50" />

                {/* Hero Content - centered */}
                <div className="relative z-10 flex h-full items-center justify-center px-4 text-center">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 drop-shadow-lg">
                            SpeedyCourier
                        </h1>
                        <p className="text-xl md:text-3xl text-white/90 mb-10 drop-shadow-md">
                            Fast, reliable pickups and dropoffs — scheduled in minutes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-6 justify-center">
                            <Link
                                href="/register"
                                className="inline-block bg-blue-600 text-white px-10 py-5 text-xl font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                            >
                                Get Started
                            </Link>
                            {!isLoggedIn && (
                                <button
                                    onClick={openLogin}
                                    className="inline-block bg-blue-600 text-white px-10 py-5 text-xl font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Scroll down indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                    <svg className="w-10 h-10 text-white opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </div>
            </motion.section>

            {/* Why Choose */}
            <motion.section {...fadeInUp} className="py-20 px-6 md:px-12 bg-white">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-800 mb-6">Why Choose SpeedyCourier?</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            We make shipping simple, fast, and reliable. Whether it&apos;s same-day or next-day, our couriers are ready when you are.
                        </p>
                        <ul className="space-y-4 text-gray-700">
                            <li className="flex items-start">
                                <span className="text-green-600 text-2xl mr-3">✓</span>
                                <span>Real-time tracking and updates</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 text-2xl mr-3">✓</span>
                                <span>Flexible scheduling — same-day available</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 text-2xl mr-3">✓</span>
                                <span>Secure, insured deliveries</span>
                            </li>
                        </ul>
                    </div>
                    <div className="relative h-96 rounded-xl overflow-hidden shadow-2xl">
                        <Image
                            src="/images/CourierHandoff.jpg"
                            alt="Our couriers in action"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </motion.section>

            {/* How it Works */}
            <motion.section {...fadeInUp} className="py-20 px-6 md:px-12 bg-gray-50">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-gray-800 mb-12">How It Works</h2>
                    <div className="grid md:grid-cols-3 gap-10">
                        <div className="p-8 bg-white rounded-xl shadow-md">
                            <div className="text-5xl mb-6 text-blue-600">1</div>
                            <h3 className="text-2xl font-semibold mb-4">Schedule</h3>
                            <p className="text-gray-600">
                                Enter pickup/dropoff details and choose your time.
                            </p>
                        </div>
                        <div className="p-8 bg-white rounded-xl shadow-md">
                            <div className="text-5xl mb-6 text-blue-600">2</div>
                            <h3 className="text-2xl font-semibold mb-4">We Pick Up</h3>
                            <p className="text-gray-600">
                                Our courier arrives on time and handles everything.
                            </p>
                        </div>
                        <div className="p-8 bg-white rounded-xl shadow-md">
                            <div className="text-5xl mb-6 text-blue-600">3</div>
                            <h3 className="text-2xl font-semibold mb-4">Delivered</h3>
                            <p className="text-gray-600">
                                Safe delivery with real-time updates.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Call to Action Footer */}
            <motion.section {...fadeInUp} className="py-16 bg-blue-600 text-white text-center">
                <h2 className="text-4xl font-bold mb-6">Ready to Ship?</h2>
                <p className="text-xl mb-8 max-w-2xl mx-auto">
                    Join thousands of happy customers who trust SpeedyCourier for fast, reliable delivery.
                </p>
                <Link
                    href="/register"
                    className="inline-block bg-white text-blue-600 px-10 py-5 text-xl font-bold rounded-xl hover:bg-gray-100 transition shadow-lg"
                >
                    Sign Up Now — It&apos;s Free!
                </Link>
            </motion.section>

            {/* Add the modal at the bottom (same as in Navbar) */}
            <LoginModal isOpen={isLoginOpen} onClose={closeLogin} />
        </>
    );
}