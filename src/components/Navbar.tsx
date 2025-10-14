// scr/components/Navbar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { logout } from '@/lib/auth-actions';
import { Session } from 'next-auth';
import LoginModal from './LoginModal';

interface NavbarProps {
    session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const openLogin = () => setIsLoginOpen(true);
    const closeLogin = () => setIsLoginOpen(false);
    return (
        <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="flex space-x-4">
                <Link href="/" className="hover:underline">Home</Link>
                {session ? (
                    <>
                        <Link href="/schedule" className="hover:underline">Schedule</Link>
                        <Link href="/history" className="hover:underline">History</Link>
                        <Link href="/account" className="hover:underline">My Account</Link>
                    </>
                ) : null}
            </div>
            <div className="flex space-x-4">
                {!session ? (
                    <>
                        <Link href="/register" className="hover:underline">Register</Link>
                        <button onClick={openLogin} className="hover:underline">Login</button>
                    </>
                ) : (
                    <form action={logout} className="inline">
                        <button type="submit" className="hover:underline">Logout</button>
                    </form>
                )}
            </div>
            <LoginModal isOpen={isLoginOpen} onClose={closeLogin} />
        </nav>
    );
}