// src/components/AvailablePickupsWithModal.tsx
'use client';

import { useState } from 'react';

import AvailablePickups from '@/components/AvailablePickups';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { PendingOrder } from '@/types/order';

interface AvailablePickupsWithModalProps {
    orders: PendingOrder[];
    courierAddress: string;
}

export function AvailablePickupsWithModal({ orders, courierAddress }: AvailablePickupsWithModalProps) {
    const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);

    return (
        <>
            <AvailablePickups orders={orders} courierAddress={courierAddress} />
            {selectedOrder && (
                <div  className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedOrder(null)}
                >
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
                    </div>
                </div>
            )}
        </>
    );
}