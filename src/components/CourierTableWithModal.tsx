// src/components/CourierTableWithModal.tsx
'use client';

import { useState } from 'react';

import { format } from 'date-fns';

import { StatusUpdateButton } from '@/components/StatusUpdateButton';
import { OrderStatus } from '@/lib/order-status';
import { formatPhone } from '@/lib/utils';
import { ExtendedOrder } from '@/types/order';

interface CourierTableWithModalProps {
    orders: ExtendedOrder[];
    title: string;
    tab: 'progress' | 'history';
    updateOrderStatus: (orderId: number, newStatus: OrderStatus) => Promise<void>;
}

export function CourierTableWithModal({ orders, title, tab, updateOrderStatus }: CourierTableWithModalProps) {
    const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);

    return (
        <>
            <section className="bg-white rounded-lg shadow overflow-hidden">
                <h2 className="px-6 py-4 text-xl font-semibold bg-gray-50 border-b">
                    {title} ({orders.length})
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left">Order ID</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Customer</th>
                                <th className="px-4 py-3 text-left hidden md:table-cell">Pickup/Dropoff</th>
                                <th className="px-4 py-3 text-left">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <td className="px-4 py-4 font-medium">#{order.id}</td>
                                    <td className="px-4 py-4">
                                        <span
                                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                                order.status === OrderStatus.EN_ROUTE_PICKUP
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {order.status.replace(/_/g, ' ')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        {order.customer.firstName} {order.customer.lastName || ''}
                                    </td>
                                    <td className="px-4 py-4 text-xs hidden md:table-cell">
                                        <div className="max-w-xs">
                                            <p className="truncate"><strong>From:</strong> {order.pickupAddress}</p>
                                            <p className="truncate"><strong>To:</strong> {order.dropoffAddress}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {tab === 'progress' && order.status === OrderStatus.EN_ROUTE_PICKUP && (
                                            <form action={updateOrderStatus.bind(null, order.id, OrderStatus.PICKED_UP)}>
                                                <StatusUpdateButton
                                                    orderId={order.id}
                                                    nextStatus={OrderStatus.PICKED_UP}
                                                    label="Mark Picked Up"
                                                    color="blue"
                                                />
                                            </form>
                                        )}
                                        {tab === 'progress' && order.status === OrderStatus.PICKED_UP && (
                                            <form action={updateOrderStatus.bind(null, order.id, OrderStatus.DELIVERED)}>
                                                <StatusUpdateButton
                                                    orderId={order.id}
                                                    nextStatus={OrderStatus.DELIVERED}
                                                    label="Mark Delivered"
                                                    color="green"
                                                />
                                            </form>
                                        )}
                                        {tab === 'history' && '—'}
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
                            </h2>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Status */}
                            <div>
                                <h3 className="font-semibold mb-2">Current Status</h3>
                                <span
                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                        selectedOrder.status === OrderStatus.EN_ROUTE_PICKUP
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : selectedOrder.status === OrderStatus.PICKED_UP
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-green-100 text-green-800'
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
                                    {selectedOrder.customer.firstName && (
                                        <p className="text-sm">
                                            Customer: {selectedOrder.customer.firstName} {selectedOrder.customer.lastName || ''}
                                            <br />
                                            Phone: {formatPhone(selectedOrder.customer.phone)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Dropoff</h3>
                                    <p className="mb-1">{selectedOrder.dropoffAddress}</p>
                                    {/* If you later add dropoff contact to the fetch, you can show it here */}
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <h3 className="font-semibold mb-1">Pieces / Weight</h3>
                                    <p>{selectedOrder.totalPieces} pieces</p>
                                    <p>{selectedOrder.orderWeight} lbs</p>
                                </div>
                            </div>

                            {/* Status History – if you add history to the fetch */}
                            {/*
                            <div>
                                <h3 className="font-semibold mb-2">Status History</h3>
                                {selectedOrder.history?.length === 0 ? (
                                    <p className="text-sm text-gray-500">No status updates yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {selectedOrder.history?.map((entry) => (
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
                            */}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}