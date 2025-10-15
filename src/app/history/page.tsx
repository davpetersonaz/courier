// src/app/history/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Order, OrderHistory } from '@prisma/client';

interface ExtendedOrder extends Order {
    history: OrderHistory[];
}

export default function History() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
    const [orders, setOrders] = useState<ExtendedOrder[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof ExtendedOrder; direction: 'asc' | 'desc' } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchOrders();
        }
    }, [status]);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders/history'); // New API for history (create below if needed, or use /api/user with orders)
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order =>
        activeTab === 'pending' ? order.status === 'pending' : order.status === 'completed'
    );

    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;
        let aVal = a[key as keyof ExtendedOrder];
        let bVal = b[key as keyof ExtendedOrder];

        // Handle null/undefined values (treat null as smaller)
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return direction === 'asc' ? -1 : 1;
        if (bVal == null) return direction === 'asc' ? 1 : -1;

        // Handle DateTime fields (Prisma returns Date objects)
        if (key === 'pickupDate' || key === 'createdAt') {
            aVal = (aVal as Date).getTime();
            bVal = (bVal as Date).getTime();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: keyof ExtendedOrder) => {
        setSortConfig(prev =>
            prev?.key === key && prev.direction === 'asc'
                ? { key, direction: 'desc' }
                : { key, direction: 'asc' }
        );
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
                <div className="text-center">Loading...</div>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
                    Please log in to view order history.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 bg-gray-100">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                    Order History for {session.user.name || session.user.username || 'User'}
                </h1>
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Pending Orders ({orders.filter(o => o.status === 'pending').length})
                        </button>
                        <button
                            onClick={() => setActiveTab('completed')}
                            className={`px-4 py-2 font-medium ${activeTab === 'completed' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Completed Orders ({orders.filter(o => o.status === 'completed').length})
                        </button>
                    </div>
                    {/* Table */}
                    {sortedOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {[
                                            { key: 'id' as keyof ExtendedOrder, label: 'Order ID' },
                                            { key: 'pickupDate' as keyof ExtendedOrder, label: 'Pickup Date' },
                                            { key: 'pickupTime' as keyof ExtendedOrder, label: 'Pickup Time' },
                                            { key: 'pickupAddress' as keyof ExtendedOrder, label: 'Pickup Address' },
                                            { key: 'pickupContactName' as keyof ExtendedOrder, label: 'Pickup Contact' },
                                            { key: 'pickupContactPhone' as keyof ExtendedOrder, label: 'Pickup Phone' },
                                            { key: 'pickupInstructions' as keyof ExtendedOrder, label: 'Pickup Instr.' },
                                            { key: 'totalPieces' as keyof ExtendedOrder, label: 'Pieces' },
                                            { key: 'orderWeight' as keyof ExtendedOrder, label: 'Weight (lbs)' },
                                            { key: 'dropoffAddress' as keyof ExtendedOrder, label: 'Dropoff Address' },
                                            { key: 'dropoffContactName' as keyof ExtendedOrder, label: 'Dropoff Contact' },
                                            { key: 'dropoffContactPhone' as keyof ExtendedOrder, label: 'Dropoff Phone' },
                                            { key: 'dropoffInstructions' as keyof ExtendedOrder, label: 'Delivery Instr.' },
                                            { key: 'status' as keyof ExtendedOrder, label: 'Status' },
                                            { key: 'createdAt' as keyof ExtendedOrder, label: 'Created' },
                                        ].map((col) => (
                                            <th
                                                key={col.key}
                                                onClick={() => handleSort(col.key)}
                                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            >
                                                {col.label}
                                                {sortConfig?.key === col.key && (
                                                    <span className="ml-1">
                                                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sortedOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(order.pickupDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.pickupTime}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{order.pickupAddress}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{order.pickupContactName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.pickupContactPhone}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={order.pickupInstructions ?? undefined}>
                                                {order.pickupInstructions || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.totalPieces}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.orderWeight}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{order.dropoffAddress}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{order.dropoffContactName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.dropoffContactPhone}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate" title={order.dropoffInstructions ?? undefined}>
                                                {order.dropoffInstructions || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500">
                            No {activeTab} orders yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}