// src/types/order.ts
import { Order, OrderHistory, OrderStatus } from '@prisma/client';

export type ExtendedOrder = Order & {
    customer: {
        firstName: string | null;
        lastName: string | null;
        phone: string;
    };
    courier: {
        firstName: string | null;
        lastName: string | null;
    } | null;
    history?: (OrderHistory & {
        changedBy: {
            firstName: string | null;
            lastName: string | null;
        } | null;
    })[];
};

export type OrderWithCustomer = {
    id: number;
    status: OrderStatus;
    customer: {
        firstName: string;
        lastName: string | null;
        email: string;
        phone: string;
    };
    pickupDate: Date;
    pickupTime: string;
    pickupAddress: string;
    dropoffAddress: string;
    totalPieces: number;
    orderWeight: number;
};

export type PendingOrder = {
    id: number;
    status: OrderStatus;
    customer: {
        firstName: string | null;
        lastName: string | null;
        phone: string;
    };
    pickupDate: Date;
    pickupTime: string;
    pickupAddress: string;
    dropoffAddress: string;
    totalPieces: number;
    orderWeight: number;
};
