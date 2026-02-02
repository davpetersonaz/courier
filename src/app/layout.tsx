// src/app/layout.tsx
import type { Metadata } from "next";
import "../styles/global.css";
import Navbar from '@/components/Navbar';
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import { Toaster } from 'sonner';
import SessionTimeout from '@/components/SessionTimeout';
import Script from 'next/script';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export const metadata: Metadata = {
    title: "Courier Service",
    description: "Schedule pickups and dropoffs",
};

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
    return (
        <html lang="en">
            <head>
                <Script
                    src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=weekly&loading=async`}
                    strategy="beforeInteractive"
                    async
                    defer
                />
            </head>
            <body>
                <SessionProviderWrapper>
                    <Navbar />
                    {children}
                    <SessionTimeout />
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
