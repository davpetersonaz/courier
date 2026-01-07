// scr/components/Navbar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import LoginModal from './LoginModal';

export default function Navbar() {
    const { data: session } = useSession(); // Get session client-side
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const openLogin = () => setIsLoginOpen(true);
    const closeLogin = () => setIsLoginOpen(false);
    const handleLogout = async () => {
        await signOut({ callbackUrl: '/' }); // This clears session and redirects
    };

    return (
        <nav className="bg-blue-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo / Home */}
                    <div className="shrink-0">
                        <Link href="/" className="text-xl font-bold hover:opacity-80">
                            SpeedyCourier
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-6">
                        {session ? (
                            <>
                                <Link href="/schedule" className="hover:opacity-80 transition">Schedule</Link>
                                <Link href="/history" className="hover:opacity-80 transition">History</Link>
                                <Link href="/account" className="hover:opacity-80 transition">My Account</Link>
                                <button onClick={handleLogout} className="hover:opacity-80 transition">Logout</button>
                            </>
                        ) : (
                            <>
                                <Link href="/register" className="hover:opacity-80 transition">Register</Link>
                                <button onClick={openLogin} className="hover:opacity-80 transition">Login</button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md hover:bg-blue-700 focus:outline-none"
                            aria-label="Main menu"
                            aria-expanded={isMobileMenuOpen}
                        >
                            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                <path
                                    className={!isMobileMenuOpen ? 'block' : 'hidden'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                                <path
                                    className={isMobileMenuOpen ? 'block' : 'hidden'}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden">
                        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-blue-700">
                            {session ? (
                                <>
                                    <Link href="/schedule"
                                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Schedule
                                    </Link>
                                    <Link href="/history"
                                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        History
                                    </Link>
                                    <Link href="/account"
                                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        My Account
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link href="/register"
                                        className="block px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Register
                                    </Link>
                                    <button
                                        onClick={() => {
                                            openLogin();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-blue-800"
                                    >
                                        Login
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={closeLogin} />
        </nav>
    );
}