// src/components/OrderDetailModal.tsx
'use client';

import { useEffect } from 'react';

import { format } from 'date-fns';

import { OrderStatus } from '@/lib/order-status';
import { formatPhone } from '@/lib/utils';
import { ExtendedOrder, PendingOrder } from '@/types/order';

type OrderForModal = ExtendedOrder | PendingOrder;
interface OrderDetailModalProps {
    order: OrderForModal;
    onClose: () => void;
}

export function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose} // Click outside to close
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Order #{order.id}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Status */}
                    <div>
                        <h3 className="font-semibold mb-2">Current Status</h3>
                        <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                order.status === OrderStatus.PENDING
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === OrderStatus.DELIVERED
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                        >
                            {order.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Pickup & Dropoff */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Pickup</h3>
                            <p className="mb-1">{order.pickupAddress}</p>
                            <p className="text-sm text-gray-600 mb-1">
                                {format(order.pickupDate, 'MMM d, yyyy')} at {order.pickupTime}
                            </p>
                            {'pickupContactName' in order && order.pickupContactName && order.pickupContactPhone && (
                                <p className="text-sm">
                                    Contact: {order.pickupContactName} – {formatPhone(order.pickupContactPhone)}
                                </p>
                            )}
                            {/* Customer info – safe for both types */}
                            {order.customer && (
                                <p className="text-sm mt-2">
                                    Customer: {order.customer.firstName ?? 'Unknown'} {order.customer.lastName ?? ''}
                                    <br />
                                    Phone: {formatPhone(order.customer.phone)}
                                </p>
                            )}
                        </div>

                        <div>
                            <h3 className="font-semibold mb-2">Dropoff</h3>
                            <p className="mb-1">{order.dropoffAddress}</p>
                            {'dropoffContactName' in order && order.dropoffContactName && order.dropoffContactPhone && (
                                <p className="text-sm">
                                    Contact: {order.dropoffContactName} – {formatPhone(order.dropoffContactPhone)}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Courier – only if present (safe chaining) */}
                    {'courier' in order && order.courier && (
                        <div>
                            <h3 className="font-semibold mb-2">Assigned Courier</h3>
                            <p>{order.courier.firstName ?? ''} {order.courier.lastName ?? ''}</p>
                        </div>
                    )}

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h3 className="font-semibold mb-1">Pieces / Weight</h3>
                            <p>{order.totalPieces} pieces</p>
                            <p>{order.orderWeight} lbs</p>
                        </div>
                        {/* Add more fields like instructions if you have them */}
                    </div>

                    {/* Status History – only if present */}
                    <div>
                        <h3 className="font-semibold mb-2">Status History</h3>
                        {'history' in order && order.history ? (
                            order.history.length === 0 ? (
                                <p className="text-sm text-gray-500">No status updates yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {order.history.map((entry) => (
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
                            )
                        ) : (
                            <p className="text-sm text-gray-500">No status updates available</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}