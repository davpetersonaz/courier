// src/actions/orderActions.ts
'use server';
import { revalidatePath } from 'next/cache';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';

export async function updateOrderStatus(orderId: number, newStatus: OrderStatus) {
    const session = await auth();
    if (!session || session.user.role !== 'COURIER') {
        throw new Error('Unauthorized');
    }

    const courierId = parseInt(session.user.id as string);

    if (newStatus === OrderStatus.EN_ROUTE_PICKUP) {
        const updated = await prisma.order.updateMany({
            where: { id: orderId, status: OrderStatus.PENDING, courierId: null },
            data: { status: OrderStatus.EN_ROUTE_PICKUP, courierId },
        });
        if (updated.count === 0) {
            throw new Error('Order already claimed or not found');
        }
    } else {
        await prisma.order.update({
            where: { id: orderId, courierId },
            data: { status: newStatus },
        });
    }

    await prisma.orderHistory.create({
        data: {
            orderId,
            customerId: (await prisma.order.findUnique({ where: { id: orderId }, select: { customerId: true } }))!.customerId,
            status: newStatus,
            changedById: courierId,
        },
    });

    revalidatePath('/courier/dashboard');
}