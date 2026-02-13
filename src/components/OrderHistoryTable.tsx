// src/components/OrderHistoryTable.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { format } from 'date-fns';

import { OrderStatus } from '@/lib/order-status';
import { formatPhone } from '@/lib/utils';
import { ExtendedOrder } from '@/types/order';

interface OrderHistoryTableProps {
    orders: ExtendedOrder[];
    isAdmin: boolean;
    currentStatus: string;
}

export function OrderHistoryTable({ orders, isAdmin, currentStatus }: OrderHistoryTableProps) {
    const router = useRouter();
    const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const params = new URLSearchParams(window.location.search);
        if (value === 'all') {
            params.delete('status');
        } else {
            params.set('status', value);
        }
        router.push(`${window.location.pathname}?${params.toString()}`);
    };

    return (
        <>
            {/* Status Filter Dropdown */}
            <div className="mb-6 flex justify-center sm:justify-start">
                <label className="block text-sm font-medium text-gray-700 mr-3 mt-1">
                    Filter by Status:
                </label>
                <select value={currentStatus} onChange={handleStatusChange}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="en_route_pickup">En Route Pickup</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="delivered">Delivered</option>
                </select>
            </div>

            {/* Table */}
            <section className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 font-medium text-gray-700">Order #</th>
                                {isAdmin && (
                                    <th className="px-4 py-3 font-medium text-gray-700">Customer</th>
                                )}
                                <th className="px-4 py-3 font-medium text-gray-700">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-700 hidden sm:table-cell">Pickup</th>
                                <th className="px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Dropoff</th>
                                <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Courier</th>
                                <th className="px-4 py-3 font-medium text-gray-700">Completed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <td className="px-4 py-4 font-medium">#{order.id}</td>
                                    {isAdmin && (
                                        <td className="px-4 py-4">
                                            {order.customer.firstName} {order.customer.lastName || ''}
                                            <p className="text-xs text-gray-500">{formatPhone(order.customer.phone)}</p>
                                        </td>
                                    )}
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                order.status === OrderStatus.PENDING
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : order.status === OrderStatus.DELIVERED
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-xs hidden sm:table-cell">
                                        {format(order.pickupDate, 'MMM d, yyyy')} at {order.pickupTime}
                                    </td>
                                    <td className="px-4 py-4 text-xs hidden md:table-cell truncate max-w-xs">
                                        {order.dropoffAddress}
                                    </td>
                                    <td className="px-4 py-4 text-xs hidden lg:table-cell">
                                        {order.courier
                                            ? `${order.courier.firstName} ${order.courier.lastName}`
                                            : 'Unassigned'}
                                    </td>
                                    <td className="px-4 py-4 text-xs">
                                        {order.status === OrderStatus.DELIVERED ? (
                                            <>
                                                {format(order.updatedAt, 'MMM d, yyyy')} <br />
                                                <span className="text-gray-500">
                                                    {format(order.updatedAt, 'h:mm a')}
                                                </span>
                                            </>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Modal Popup */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-2xl font-bold">
                                Order #{selectedOrder.id}
                                {isAdmin && (
                                    <span className="ml-3 text-lg text-gray-600">
                                        by {selectedOrder.customer.firstName} {selectedOrder.customer.lastName || ''}
                                    </span>
                                )}
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <h3 className="font-semibold mb-2">Status</h3>
                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedOrder.status === OrderStatus.PENDING
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : selectedOrder.status === OrderStatus.DELIVERED
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                >
                                    {selectedOrder.status.replace(/_/g, ' ')}
                                </span>
                            </div>

                            {/* Pickup & Dropoff */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h3 className="font-semibold mb-2">Pickup</h3>
                                    <p className="mb-1">{selectedOrder.pickupAddress}</p>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {format(selectedOrder.pickupDate, 'MMM d, yyyy')} at {selectedOrder.pickupTime}
                                    </p>
                                    {selectedOrder.pickupContactName && selectedOrder.pickupContactPhone && (
                                        <p className="text-sm">
                                            Contact: {selectedOrder.pickupContactName} ({formatPhone(selectedOrder.pickupContactPhone)})
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Dropoff</h3>
                                    <p className="mb-1">{selectedOrder.dropoffAddress}</p>
                                    {selectedOrder.dropoffContactName && selectedOrder.dropoffContactPhone && (
                                        <p className="text-sm">
                                            Contact: {selectedOrder.dropoffContactName} ({formatPhone(selectedOrder.dropoffContactPhone)})
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Admin extras */}
                            {isAdmin && (
                                <>
                                    {selectedOrder.courier && (
                                        <div>
                                            <h3 className="font-semibold mb-2">Assigned Courier</h3>
                                            <p>
                                                {selectedOrder.courier.firstName} {selectedOrder.courier.lastName}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Status History */}
                            <div>
                                <h3 className="font-semibold mb-2">Status History</h3>
                                {selectedOrder.history?.length === 0 ? (
                                    <p className="text-sm text-gray-500">No status updates yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedOrder.history!.map((entry) => (
                                            <div key={entry.id} className="flex items-center space-x-3 text-sm border-l-2 border-gray-300 pl-3">
                                                <span className="text-gray-600">
                                                    {format(entry.updatedAt, 'MMM d, yyyy h:mm a')}
                                                </span>
                                                <span className="font-medium">
                                                    → {entry.status.replace(/_/g, ' ')}
                                                </span>
                                                {entry.changedBy && (
                                                    <span className="text-xs text-blue-600">
                                                        by {entry.changedBy.firstName} {entry.changedBy.lastName}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pieces / Weight / Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-1">Details</h3>
                                    <p>{selectedOrder.totalPieces} pieces</p>
                                    <p>{selectedOrder.orderWeight} lbs</p>
                                </div>
                                {/* Add notes or other fields here if needed */}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}