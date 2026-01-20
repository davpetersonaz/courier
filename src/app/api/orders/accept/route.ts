// src/app/api/orders/accept/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'COURIER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courierId = parseInt(session.user.id);
    const { orderId, status } = await request.json();

    if (status !== OrderStatus.EN_ROUTE_PICKUP) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    try {
        const updated = await prisma.order.updateMany({
            where: {
                id: orderId,
                status: OrderStatus.PENDING,
                courierId: null,
            },
            data: {
                status: OrderStatus.EN_ROUTE_PICKUP,
                courierId,
            },
        });

        if (updated.count === 0) {
            return NextResponse.json({ error: 'Already claimed or invalid order' }, { status: 400 });
        }

        await prisma.orderHistory.create({
            data: {
                orderId,
                customerId: courierId,
                status: OrderStatus.EN_ROUTE_PICKUP,
                changedById: courierId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to accept job' }, { status: 500 });
    }
}