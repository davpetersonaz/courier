// src/components/LoginModal.tsx
'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        setIsSubmitting(true);
        const result = await signIn('credentials', {
            username,
            password,
            redirect: false, // Handle redirect manually
        });
        setIsSubmitting(false);
        if (result?.error) {
            alert('Login failed: ' + result.error);
        } else {
            onClose(); // Close modal
            window.location.href = '/history'; // Redirect to history on success
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-md w-full max-w-md">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Login</h2>
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
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="flex items-center">
                            <input
                                id="rememberMe"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={e => setRememberMe(e.target.checked)}
                                className="mr-2 h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 rounded"
                                disabled={isSubmitting}
                            />
                            <label htmlFor="rememberMe" className="text-sm text-gray-700">
                                Remember Me
                            </label>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                            >
                                {isSubmitting ? 'Logging in...' : 'Login'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}