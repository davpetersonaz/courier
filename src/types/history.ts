// src/types/history.ts
export interface HistoryOrder {
    id: number;
    pickupDate: string;
    pickupTime: string;
    pickupAddress: string;
    dropoffAddress: string;
    updatedAt: string; // ISO string
    customer: {
        firstName: string;
        lastName: string | null;
        phone: string;
    };
}

export interface HistoryResponse {
    orders: HistoryOrder[];
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
}