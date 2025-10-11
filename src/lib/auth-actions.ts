// src/lib/auth-actions.ts
'use server';
import { redirect } from 'next/navigation';

export async function logout() {
    // Make a POST request to the NextAuth.js sign-out endpoint
    await fetch('/api/auth/signout', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    // Redirect to the homepage
    redirect('/');
}