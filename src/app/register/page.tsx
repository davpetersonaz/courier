// src/app/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoadScript } from '@react-google-maps/api';
import Link from 'next/link';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [phone, setPhone] = useState('');
    const router = useRouter();

    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });
    console.log('Maps loaded:', isLoaded, 'Error:', loadError);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            alert('Passwords do not match. Please try again.');
            return;
        }
        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                body: JSON.stringify({ username, email, password, firstName, lastName, address, city, state, zip, phone }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    window.scrollTo(0, 0);
                    alert('Registration successful! You can now log in.');
                    router.push('/'); // or '/login' if you make one
                }
            } else {
                let error = 'Registration failed';
                try {
                    const data = await res.json();
                    error = data.error || error;
                } catch {
                    // If not JSON, use status text
                    error = res.statusText || error;
                }
                alert(error);
            }
        } catch (err) {
            alert('Registration failed: ' + String(err));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            {loadError && <p className="text-red-600">Google Maps failed to load: {loadError.message}</p>}
            {!isLoaded && !loadError && <p>Loading Google Maps...</p>}
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                    Register
                </h1>
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col">
                            <label htmlFor="username" className="text-sm font-medium text-gray-700 mb-1">
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
                        <div className="flex flex-col">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
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
                        <div className="flex flex-col">
                            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-1">
                                First Name
                            </label>
                            <input
                                id="firstName"
                                type="text"
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                placeholder="First Name"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-1">
                                Last Name
                            </label>
                            <input
                                id="lastName"
                                type="text"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                placeholder="Last Name"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1">
                                Address (Street)
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                placeholder="Street Address"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="city" className="text-sm font-medium text-gray-700 mb-1">
                                City
                            </label>
                            <input
                                id="city"
                                type="text"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                placeholder="Anytown"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="state" className="text-sm font-medium text-gray-700 mb-1">
                                State
                            </label>
                            <input
                                id="state"
                                type="text"
                                value={state}
                                onChange={e => setState(e.target.value)}
                                placeholder="CA"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="zip" className="text-sm font-medium text-gray-700 mb-1">
                                ZIP Code
                            </label>
                            <input
                                id="zip"
                                type="text"
                                value={zip}
                                onChange={e => setZip(e.target.value)}
                                placeholder="12345"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                id="phone"
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Phone"
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <button type="submit" className="w-full max-w-xs bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition">
                                Register
                            </button>
                        </div>
                    </form>
                </div>
                <p className="mt-4 text-sm text-center text-gray-600">
                    Already have an account?{' '}
                    <Link href="/" scroll={true} className="text-blue-500 underline hover:text-blue-600">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}