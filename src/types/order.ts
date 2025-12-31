// src/types/order.ts
import { Order, OrderHistory } from '@prisma/client';

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