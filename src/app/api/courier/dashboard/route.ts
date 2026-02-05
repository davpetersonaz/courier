// src/app/api/courier/dashboard/route.ts
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';

export async function GET() {
    const session = await auth();
    if (!session || session.user.role !== 'COURIER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courierId = parseInt(session.user.id as string);

    const [pendingOrders, inProgressOrders, deliveredCount] = await Promise.all([
        prisma.order.findMany({
            where: { status: OrderStatus.PENDING, courierId: null },
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true } },
            },
            orderBy: { createdAt: 'asc' },
        }),
        prisma.order.findMany({
            where: {
                courierId,
                status: { in: [OrderStatus.EN_ROUTE_PICKUP, OrderStatus.PICKED_UP] },
            },
            include: {
                customer: { select: { firstName: true, lastName: true, phone: true } },
            },
            orderBy: { pickupDate: 'asc' },
        }),
        prisma.order.count({
            where: { courierId, status: OrderStatus.DELIVERED },
        }),
    ]);

    return NextResponse.json({
        pendingOrders,
        inProgressOrders,
        deliveredCount,
        username: session.user.username,
    });
}