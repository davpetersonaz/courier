'use client';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface UserData {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
}

export default function MyAccount() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [verifyPassword, setVerifyPassword] = useState('');
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (status === 'authenticated') {
            fetchUserData();
        } else if (status === 'unauthenticated') {
            router.push('/'); // Redirect if not logged in
        }
    }, [status, router]);

    const fetchUserData = async () => {
        try {
            const res = await fetch('/api/user');
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
            } else {
                alert('Failed to load user data');
            }
        } catch (err) {
            alert('Error: ' + String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;

        setUpdating(true);
        try {
            const res = await fetch('/api/user', {
                method: 'PUT',
                body: JSON.stringify({
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    address: userData.address,
                    city: userData.city,
                    state: userData.state,
                    zip: userData.zip,
                    phone: userData.phone
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                alert('Account updated successfully!');
                // Optionally refetch or redirect
            } else {
                const { error } = await res.json();
                alert('Update failed: ' + error);
            }
        } catch (err) {
            alert('Error: ' + String(err));
        } finally {
            setUpdating(false);
        }
    };

    if (status === 'loading' || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session || !userData) {
        return null; // Will redirect via useEffect
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="w-full max-w-md">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                    My Account
                </h1>
                <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-200">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username is read-only since it's tied to auth */}
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="username"
                                value={userData.username}
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md bg-gray-100"
                                readOnly
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="text"
                                value={userData.email}
                                onChange={e => setUserData({ ...userData, email: e.target.value })}
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
                                value={userData.firstName}
                                onChange={e => setUserData({ ...userData, firstName: e.target.value })}
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
                                value={userData.lastName}
                                onChange={e => setUserData({ ...userData, lastName: e.target.value })}
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div className="flex flex-col">
                            <label htmlFor="address" className="text-sm font-medium text-gray-700 mb-1">
                                Address
                            </label>
                            <input
                                id="address"
                                type="text"
                                value={userData.address}
                                onChange={e => setUserData({ ...userData, address: e.target.value })}
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
                                value={userData.city}
                                onChange={e => setUserData({ ...userData, city: e.target.value })}
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
                                value={userData.state}
                                onChange={e => setUserData({ ...userData, state: e.target.value })}
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
                                value={userData.zip}
                                onChange={e => setUserData({ ...userData, zip: e.target.value })}
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
                                value={userData.phone}
                                onChange={e => setUserData({ ...userData, phone: e.target.value })}
                                className="mt-1 border-2 border-gray-300 p-2 w-full rounded-md focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>
                        <div className="flex flex-col items-center">
                            <button
                                type="submit"
                                disabled={updating}
                                className="w-full max-w-xs bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                            >
                                {updating ? 'Updating...' : 'Update Account'}
                            </button>
                        </div>
                        <div className="flex flex-col items-center mt-6">
                            <button
                                type="button"
                                onClick={() => setShowPasswordDialog(true)}
                                className="text-blue-600 hover:text-blue-800 underline text-sm"
                            >
                                Change Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {showPasswordDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Change Password</h2>
                    {passwordError && (
                        <p className="text-red-600 text-sm mb-4">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                        <p className="text-green-600 text-sm mb-4 bg-green-50 p-3 rounded">{passwordSuccess}</p>
                    )}

                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setPasswordError('');

                            if (newPassword !== verifyPassword) {
                                setPasswordError('New passwords do not match');
                                return;
                            }
                            if (newPassword.length < 6) {
                                setPasswordError('New password must be at least 6 characters');
                                return;
                            }
                            setPasswordUpdating(true);

                            try {
                                const res = await fetch('/api/user/password', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        oldPassword,
                                        newPassword,
                                    }),
                                });

                                if (res.ok) {
                                    setPasswordSuccess('Password changed successfully!');
                                    setOldPassword('');
                                    setNewPassword('');
                                    setVerifyPassword('');
                                    setTimeout(() => {
                                        setShowPasswordDialog(false);
                                        setPasswordSuccess('');
                                    }, 2000);
                                } else {
                                    const { error } = await res.json();
                                    setPasswordError(error || 'Failed to change password');
                                }
                            } catch (err) {
                                console.error('error in account/page', err);
                                setPasswordError('Network error');
                            } finally {
                                setPasswordUpdating(false);
                            }
                        }}
                        className="space-y-4"
                    >
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Password
                        </label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full border-2 border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Verify New Password
                            </label>
                            <input
                                type="password"
                                value={verifyPassword}
                                onChange={(e) => setVerifyPassword(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordDialog(false);
                                    setPasswordError('');
                                    setOldPassword('');
                                    setNewPassword('');
                                    setVerifyPassword('');
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={passwordUpdating}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {passwordUpdating ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            )}

        </div>
    );
}