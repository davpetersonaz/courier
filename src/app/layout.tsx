// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Link from 'next/link';
import SessionProviderWrapper from '../components/SessionProviderWrapper';
import { logout } from '@/lib/auth-actions';
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Courier Service",
    description: "Schedule pickups and dropoffs",
};

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
    const session = await getServerSession(authOptions);
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <SessionProviderWrapper>
                    <nav className="bg-blue-600 text-white p-4 flex space-x-4">
                        <Link href="/" className="hover:underline">Home</Link>
                        {session ? (
                            <>
                                <Link href="/schedule" className="hover:underline">Schedule</Link>
                                <Link href="/history" className="hover:underline">History</Link>
                                <form action={logout} method="post">
                                    <button type="submit" className="hover:underline">Logout</button>
                                </form>
                            </>
                        ) : (
                            <Link href="/register" className="hover:underline">Register</Link>
                        )}
                    </nav>
                    {children}
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
