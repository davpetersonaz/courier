// src/app/api/orders/bulk-delete/route.ts
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderIds } = await req.json();
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
    }

    try {
        await prisma.order.deleteMany({
            where: { id: { in: orderIds } },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Bulk delete error:', error);
        return NextResponse.json({ error: 'Failed to delete orders' }, { status: 500 });
    }
}