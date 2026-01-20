// src/components/AvailablePickups.tsx
'use client';
import { useState } from 'react';

interface AvailablePickupsProps {
    orders: Array<{
        id: number;
        customer: { firstName: string; lastName: string | null; phone: string };
        pickupDate: Date;
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
        totalPieces: number;
        orderWeight: number;
    }>;
}

export default function AvailablePickups({ orders }: AvailablePickupsProps) {
    const [selected, setSelected] = useState<number[]>([]);

    const toggleSelect = (id: number) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const acceptJob = async (orderId: number) => {
        try {
            const res = await fetch('/api/orders/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: 'EN_ROUTE_PICKUP' }),
            });
            if (res.ok) {
                alert('Job accepted!');
                window.location.reload(); // refresh to update UI
            } else {
                alert('Failed to accept job');
            }
        } catch (err) {
            console.error('error in AvailablePickups', err);
            alert('Error accepting job');
        }
    };

    const generateRoute = () => {
        if (selected.length === 0) return;

        // Build Google Maps URL with waypoints
        const waypoints = selected
            .map(id => orders.find(o => o.id === id)?.pickupAddress)
            .filter((addr): addr is string => !!addr)
            .map(encodeURIComponent);

        const dropoffs = selected
            .map(id => orders.find(o => o.id === id)?.dropoffAddress)
            .filter((addr): addr is string => !!addr)
            .map(encodeURIComponent);

        const allStops = [...waypoints, ...dropoffs];
        if (allStops.length === 0) return;

        const origin = 'Current+Location'; // or use geolocation later
        const destination = allStops[allStops.length - 1];
        const waypointsParam = allStops.slice(0, -1).join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${destination}&waypoints=${waypointsParam}&travelmode=driving&optimize=true`;
        window.open(url, '_blank');
    };

    return (
        <section className="bg-white rounded-lg shadow overflow-hidden">
            {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                    No pending pickups right now. Check back soon!
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-center w-10"><input type="checkbox" disabled /></th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Order ID</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Customer</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Pickup Time</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Pickup Address</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Dropoff</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Details</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map(order => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                className="h-5 w-5 text-blue-600 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-4 font-medium">#{order.id}</td>
                                        <td className="px-4 py-4">
                                            {order.customer.firstName} {order.customer.lastName || ''}
                                            <p className="text-xs text-gray-500">{order.customer.phone}</p>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            {new Date(order.pickupDate).toLocaleDateString()} <br />
                                            <span className="font-medium">{order.pickupTime}</span>
                                        </td>
                                        <td className="px-4 py-4 text-xs md:text-sm hidden lg:table-cell">
                                            {order.pickupAddress}
                                        </td>
                                        <td className="px-4 py-4 text-xs md:text-sm hidden lg:table-cell">
                                            {order.dropoffAddress}
                                        </td>
                                        <td className="px-4 py-4 text-xs">
                                            {order.totalPieces} pcs • {order.orderWeight} lbs
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button 
                                                onClick={() => acceptJob(order.id)}
                                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                            >
                                                Accept Job
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Route Button */}
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button
                            onClick={generateRoute}
                            disabled={selected.length === 0}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate Optimized Route ({selected.length} selected)
                        </button>
                    </div>
                </>
            )}
        </section>
    );
}