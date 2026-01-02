// src/app/api/orders/update/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';

export async function POST(request: Request) {
    const session = await auth();
    if (!session || session.user.role !== 'COURIER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courierId = parseInt(session.user.id as string);
    const { orderId, newStatus } = await request.json();

    if (!orderId || !newStatus) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    try {
        if (newStatus === OrderStatus.EN_ROUTE_PICKUP) {
            // Atomic claim
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
                return NextResponse.json({ error: 'Order already claimed by another courier' }, { status: 409 });
            }
        } else {
            // For PICKED_UP or DELIVERED
            await prisma.order.update({
                where: {
                    id: orderId,
                    courierId,  // Security check
                },
                data: { status: newStatus },
            });
        }

        // Log history
        await prisma.orderHistory.create({
            data: {
                orderId,
                customerId: courierId,
                status: newStatus,
                changedById: courierId,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update order error:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}