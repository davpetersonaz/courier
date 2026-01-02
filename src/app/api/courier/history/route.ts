// src/app/api/courier/history/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';

const PAGE_SIZE = 25;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');

    const session = await auth();
    if (!session || session.user.role !== 'COURIER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courierId = parseInt(session.user.id as string);

    const skip = (page - 1) * PAGE_SIZE;

    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where: {
                courierId,
                status: OrderStatus.DELIVERED
            },
            include: {
                customer: {
                    select: { firstName: true, lastName: true, phone: true }
                }
            },
            orderBy: { updatedAt: 'desc' },
            take: PAGE_SIZE,
            skip
        }),
        prisma.order.count({
            where: {
                courierId,
                status: OrderStatus.DELIVERED
            }
        })
    ]);

    const totalPages = Math.ceil(total / PAGE_SIZE);

    return NextResponse.json({
        orders,
        page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1
    });
}