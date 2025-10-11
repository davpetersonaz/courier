'use client';
import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';

export default function Home() {
    const { data: session } = useSession();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    // Load remembered username from local storage
    useEffect(() => {
        const savedUsername = localStorage.getItem('rememberedUsername');
        if (savedUsername) {
            setUsername(savedUsername);
            setRememberMe(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rememberMe) {
            localStorage.setItem('rememberedUsername', username);
        } else {
            localStorage.removeItem('rememberedUsername');
        }
        const result = await signIn('credentials', {
            username,
            password,
            redirect: false, // Handle redirect manually
        });
        if (result?.error) {
            alert('Login failed: ' + result.error);
        } else {
            window.location.href = '/history'; // Redirect to history on success
        }
    };

    if (session) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-800">Welcome, {session.user.name || session.user.username}!</h1>
                    <p className="mt-4 text-lg text-gray-600">You are logged in.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                    Welcome to Courier Service
                </h1>
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Username"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-gray-700">
                                Remember Me
                            </label>
                        </div>
                        <button type="submit" className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">
                            Login
                        </button>
                    </form>
                </div>
                <p className="mt-4 text-sm text-center text-gray-600">
                    Don&apos;t have an account?{' '}
                    <Link href="/register" className="text-blue-500 hover:underline hover:text-blue-600">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
}