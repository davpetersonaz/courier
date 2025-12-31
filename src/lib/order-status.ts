// src/lib/order-status.ts
export const OrderStatus = {
    PENDING: 'PENDING',
    EN_ROUTE_PICKUP: 'EN_ROUTE_PICKUP',
    PICKED_UP: 'PICKED_UP',
    DELIVERED: 'DELIVERED',
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];