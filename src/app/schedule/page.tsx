// src/app/schedule/page.tsx
'use client';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface OrderFormData {
    pickupDate: string;
    pickupTime: string;
    pickupAddress: string;
    pickupContactName: string;
    pickupContactPhone: string;
    pickupInstructions: string;
    totalPieces: string;
    orderWeight: string;
    dropoffAddress: string;
    dropoffContactName: string;
    dropoffContactPhone: string;
    dropoffInstructions: string;
}

export default function Schedule() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState<OrderFormData>({
        pickupDate: new Date().toISOString().split('T')[0], // Default to today
        pickupTime: new Date().toTimeString().slice(0, 5), // Default to current time (HH:MM)
        pickupAddress: '',
        pickupContactName: '',
        pickupContactPhone: '',
        pickupInstructions: '',
        totalPieces: '',
        orderWeight: '',
        dropoffAddress: '',
        dropoffContactName: '',
        dropoffContactPhone: '',
        dropoffInstructions: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveRecipient, setSaveRecipient] = useState(false);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session) {
        router.push('/');
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.pickupTime || !formData.totalPieces || !parseFloat(formData.orderWeight)) {
            alert('Please fill in pickup time, total pieces, and order weight.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({
                    ...formData,
                    saveRecipient
                }),
                headers: { 'Content-Type': 'application/json' },
            });
            let error = 'Unknown error';
            if (res.ok) {
                alert('Order scheduled successfully!');
                // Reset form or redirect
                setFormData({
                    pickupDate: new Date().toISOString().split('T')[0],
                    pickupTime: new Date().toTimeString().slice(0, 5),
                    pickupAddress: '',
                    pickupContactName: '',
                    pickupContactPhone: '',
                    pickupInstructions: '',
                    totalPieces: '',
                    orderWeight: '',
                    dropoffAddress: '',
                    dropoffContactName: '',
                    dropoffContactPhone: '',
                    dropoffInstructions: '',
                });
                router.push('/history');
            } else {
                // Handle non-JSON or empty body gracefully
                try {
                    const data = await res.json();
                    error = data.error || error;
                } catch (parseErr) {
                    console.error('Failed to parse error response:', parseErr);
                    error = 'Server error (no details available)';
                }
                alert('Failed to schedule order: ' + error);
            }
        } catch (err) {
            alert('Network Error: ' + String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        setFormData({
            pickupDate: new Date().toISOString().split('T')[0],
            pickupTime: new Date().toTimeString().slice(0, 5),
            pickupAddress: '',
            pickupContactName: '',
            pickupContactPhone: '',
            pickupInstructions: '',
            totalPieces: '',
            orderWeight: '',
            dropoffAddress: '',
            dropoffContactName: '',
            dropoffContactPhone: '',
            dropoffInstructions: '',
        });
    };

    return (
        <div className="min-h-screen p-4 bg-gray-100">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Schedule a Pickup</h1>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
                    {/* Pickup Pane */}
                    <div className="border border-gray-300 p-6 rounded-md">
                        <h2 className="text-2xl font-semibold mb-4">Pickup Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Date
                                </label>
                                <input
                                    id="pickupDate"
                                    name="pickupDate"
                                    type="date"
                                    value={formData.pickupDate}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Time
                                </label>
                                <input
                                    id="pickupTime"
                                    name="pickupTime"
                                    type="time"
                                    value={formData.pickupTime}
                                    onChange={handleChange}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="pickupAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Address
                                </label>
                                <input
                                    id="pickupAddress"
                                    name="pickupAddress"
                                    type="text"
                                    value={formData.pickupAddress}
                                    onChange={handleChange}
                                    placeholder="Full pickup address"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="pickupContactName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Name
                                </label>
                                <input
                                    id="pickupContactName"
                                    name="pickupContactName"
                                    type="text"
                                    value={formData.pickupContactName}
                                    onChange={handleChange}
                                    placeholder="Name at pickup location"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="pickupContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Phone
                                </label>
                                <input
                                    id="pickupContactPhone"
                                    name="pickupContactPhone"
                                    type="tel"
                                    value={formData.pickupContactPhone}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="pickupInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Instructions
                                </label>
                                <textarea
                                    id="pickupInstructions"
                                    name="pickupInstructions"
                                    value={formData.pickupInstructions}
                                    onChange={handleChange}
                                    placeholder="Any special instructions..."
                                    rows={3}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="totalPieces" className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Pieces
                                </label>
                                <input
                                    id="totalPieces"
                                    name="totalPieces"
                                    type="number"
                                    value={formData.totalPieces}
                                    onChange={handleChange}
                                    placeholder="e.g., 5"
                                    min="1"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="orderWeight" className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Weight (lbs)
                                </label>
                                <input
                                    id="orderWeight"
                                    name="orderWeight"
                                    type="number"
                                    step="0.1"
                                    value={formData.orderWeight}
                                    onChange={handleChange}
                                    placeholder="e.g., 10.5"
                                    min="0.1"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Destination Pane */}
                    <div className="border border-gray-300 p-6 rounded-md">
                        <h2 className="text-2xl font-semibold mb-4">Destination Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label htmlFor="dropoffAddress" className="block text-sm font-medium text-gray-700 mb-1">
                                    Dropoff Address
                                </label>
                                <input
                                    id="dropoffAddress"
                                    name="dropoffAddress"
                                    type="text"
                                    value={formData.dropoffAddress}
                                    onChange={handleChange}
                                    placeholder="Full dropoff address"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="dropoffContactName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Name
                                </label>
                                <input
                                    id="dropoffContactName"
                                    name="dropoffContactName"
                                    type="text"
                                    value={formData.dropoffContactName}
                                    onChange={handleChange}
                                    placeholder="Name at dropoff location"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="dropoffContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Phone
                                </label>
                                <input
                                    id="dropoffContactPhone"
                                    name="dropoffContactPhone"
                                    type="tel"
                                    value={formData.dropoffContactPhone}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="dropoffInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Instructions
                                </label>
                                <textarea
                                    id="dropoffInstructions"
                                    name="dropoffInstructions"
                                    value={formData.dropoffInstructions}
                                    onChange={handleChange}
                                    placeholder="Any special instructions..."
                                    rows={3}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 my-6">
                        <input
                            type="checkbox"
                            id="saveRecipient"
                            checked={saveRecipient}
                            onChange={(e) => setSaveRecipient(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="saveRecipient" className="text-sm font-medium text-gray-700">
                            Save this recipient for future orders
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-4 justify-end">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400 transition"
                            disabled={isSubmitting}
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
                        >
                            {isSubmitting ? 'Scheduling...' : 'Schedule Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}