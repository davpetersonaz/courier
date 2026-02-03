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
        phone: string;
    };
    pickupAddress: string;
    dropoffAddress: string;
    // add other fields you use in the table
};
