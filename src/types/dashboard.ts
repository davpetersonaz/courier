// src/types/dashboard.ts
import { OrderStatus } from '@/lib/order-status';

export interface DashboardData {
    pendingOrders: Array<{
        id: number;
        pickupDate: string; // or Date if you parse it
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
        totalPieces: number;
        orderWeight: number;
        status: OrderStatus;
        customer: {
            firstName: string;
            lastName: string | null;
            phone: string;
        };
    }>;
    inProgressOrders: Array<{
        id: number;
        pickupAddress: string;
        dropoffAddress: string;
        status: OrderStatus;
        customer: {
            firstName: string;
            lastName: string | null;
            };
    }>;
    deliveredCount: number;
    username: string;
}