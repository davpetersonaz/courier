// src/lib/auth-actions.ts
'use server';
import { redirect } from 'next/navigation';

export async function logout() {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';  // Fallback for dev
    try {
        await fetch(`${baseUrl}/api/auth/signout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                callbackUrl: '/',  // Redirect here after signout
            }),
        });
    } catch (error) {
        console.error('Logout failed:', error);  // Log for debug
    }
    redirect('/');
}