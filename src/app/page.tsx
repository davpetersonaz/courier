import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import LandingHero from '@/components/LandingHero';

const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    transition: {
        duration: 0.8,
        ease: "easeOut" as const
    },
    viewport: { once: true, amount: 0.3 }
};

export default function Home() {
    return (
        <div className="min-h-screen bg-gray-50">
            <LandingHero />

            {/* Scrollable Content Sections Below */}
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
                            src="/delivery-team.jpg" // replace with your image
                            alt="Our couriers in action"
                            fill
                            className="object-cover"
                        />
                    </div>
                </div>
            </motion.section>

            {/* Another section - e.g. How it Works */}
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
        </div>
    );
}