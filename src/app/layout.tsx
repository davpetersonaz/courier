// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/global.css";
import Navbar from '@/components/Navbar';
import SessionProviderWrapper from '../components/SessionProviderWrapper';
import { Toaster } from 'sonner';

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
    return (
        <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <SessionProviderWrapper>
                    <Navbar />
                    {children}
                    <Toaster 
                        position="bottom-right"
                        richColors
                        closeButton
                        duration={5000}
                        toastOptions={{
                            style: { fontSize: '0.95rem' },
                        }}
                    />
                </SessionProviderWrapper>
            </body>
        </html>
    );
}
