// src/components/AcceptButton.tsx
'use client';
import { useFormStatus } from 'react-dom';

import { updateOrderStatus } from '@/actions/orderActions';
import { OrderStatus } from '@/lib/order-status';

interface StatusUpdateButtonProps {
    orderId: number;
    nextStatus: OrderStatus;
    label: string;                    // e.g. "Accept Job", "Mark Picked Up"
    color: 'green' | 'blue';          // for bg color variation
}

export function StatusUpdateButton({ orderId, nextStatus, label, color='green' }: StatusUpdateButtonProps) {
    const { pending } = useFormStatus();
    const bgColor = (color === 'green' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700');
    return (
        <button
            type="submit"
            formAction={updateOrderStatus.bind(null, orderId, nextStatus)}
            disabled={pending}
            className={`px-3 py-1.5 ${bgColor} text-white text-xs rounded transition ${pending ? 'opacity-50 cursor-wait' : ''}`}
        >
            {pending ? 'Updating...' : label}
        </button>
    );
}