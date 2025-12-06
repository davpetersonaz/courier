// src/app/api/orders/history/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'
import prisma from '@/lib/db';

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.customer.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const orders = await prisma.order.findMany({
            where: { customerId: user.id },
            include: { history: true },
            orderBy: { createdAt: 'desc' }, // Default sort by newest
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}