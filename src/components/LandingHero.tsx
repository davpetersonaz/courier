'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const fadeInUp = { /* your variant */ };

export default function LandingHero() {
    return (
        <motion.section {...fadeInUp} className="relative h-screen w-full overflow-hidden">
            {/* Background Image - covers entire viewport */}
            <div className="absolute inset-0">
                <Image
                    src="/images/PhoenixSkyline123.jpg"
                    alt="Courier delivery hero"
                    fill
                    priority // Loads fast for above-the-fold
                    quality={85}
                    className="object-cover brightness-[0.65] scale-105 transition-transform duration-700 hover:scale-110"
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
                        <Link
                            href="/about"
                            className="inline-block bg-white/20 backdrop-blur-sm text-white px-10 py-5 text-xl font-semibold rounded-xl border border-white/40 hover:bg-white/30 transition"
                        >
                            Learn More
                        </Link>
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
    );
}