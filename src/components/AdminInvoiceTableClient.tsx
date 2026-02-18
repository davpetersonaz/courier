// src/components/AdminInvoiceTableClient.tsx
'use client';
import { useEffect,useRef, useState, useTransition } from 'react';

import { format } from 'date-fns';

interface AdminInvoiceTableClientProps {
    orders: Array<{
        id: number;
        pickupDate: Date;
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
        totalPieces: number;
        orderWeight: number;
    }>;
}

export function AdminInvoiceTableClient({ orders }: AdminInvoiceTableClientProps) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isPending, startTransition] = useTransition();
    const checkAllRef = useRef<HTMLInputElement>(null);

    const allSelected = selectedIds.length === orders.length && orders.length > 0;
    const someSelected = selectedIds.length > 0 && selectedIds.length < orders.length;

    useEffect(() => {
        if (checkAllRef.current) {
            checkAllRef.current.indeterminate = someSelected && !allSelected;
        }
    }, [someSelected, allSelected]);

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(orders.map(o => o.id));
        }
    };

    const toggleOrder = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDelete = () => {
        if (!confirm(`Delete ${selectedIds.length} selected orders? This cannot be undone.`)) return;

        startTransition(async () => {
            const res = await fetch('/api/orders/bulk-delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderIds: selectedIds }),
            });
            if (res.ok) {
                window.location.reload(); // Refresh to reflect deletions
                setSelectedIds([]);
            } else {
                alert('Failed to delete orders');
            }
        });
    };

    return (
        <div>
            {/* Bulk actions */}
            {selectedIds.length > 0 && (
                <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">
                        {selectedIds.length} selected
                    </p>
                    <button onClick={handleDelete} disabled={isPending}
                        className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ${isPending ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isPending ? 'Deleting...' : 'Delete Selected'}
                    </button>
                </div>
            )}

            <div className="overflow-x-auto bg-white rounded-lg shadow">
                <table className="w-full text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input
                                    type="checkbox"
                                    ref={checkAllRef}
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="h-5 w-5 text-blue-600 rounded"
                                />
                            </th>
                            <th className="px-4 py-3">Order #</th>
                            <th className="px-4 py-3">Date / Time</th>
                            <th className="px-4 py-3">Pickup → Dropoff</th>
                            <th className="px-4 py-3">Pieces / Weight</th>
                            <th className="px-4 py-3 text-right">Charge</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {orders.map((order) => {
                            const price = order.pickupDate.getHours() < 9 ? 15.99 : 12.99;
                            const isSelected = selectedIds.includes(order.id);

                            return (
                                <tr key={order.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleOrder(order.id)}
                                            className="h-5 w-5 text-blue-600 rounded"
                                        />
                                    </td>
                                    <td className="px-4 py-3">#{order.id}</td>
                                    <td className="px-4 py-3">
                                        {format(order.pickupDate, 'MMM d, yyyy')} at {order.pickupTime}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.pickupAddress} → {order.dropoffAddress}
                                    </td>
                                    <td className="px-4 py-3">
                                        {order.totalPieces} pcs / {order.orderWeight} lbs
                                    </td>
                                    <td className="px-4 py-3 text-right">${price.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}