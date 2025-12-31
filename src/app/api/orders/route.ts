// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth'
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';

export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized - No email in session' }, { status: 401 });
    }

    let customerId: number;
    try {
        // Always query user by email to get ID (consistent with /api/user)
        const user = await prisma.customer.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        customerId = user.id;
    } catch (err) {
        console.error('User query error:', err);
        return NextResponse.json({ error: 'Session validation failed' }, { status: 500 });
    }

    try {
        const body = await request.json();

        const {
            pickupDate,
            pickupTime,
            pickupAddress,
            pickupContactName,
            pickupContactPhone,
            pickupInstructions,
            totalPieces,
            orderWeight,
            dropoffAddress,
            dropoffContactName,
            dropoffContactPhone,
            dropoffInstructions,
        } = body;

        // Validate numbers
        const pieces = parseInt(totalPieces);
        const weight = parseFloat(orderWeight);
        if (isNaN(pieces) || isNaN(weight)) {
            throw new Error('Invalid total pieces or weight');
        }

        // Combine date and time into pickupDateTime
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
        if (isNaN(pickupDateTime.getTime())) {
            throw new Error('Invalid date or time');
        }

        const order = await prisma.order.create({
            data: {
                customer: {
                    connect: { id: customerId } // Explicit relation connect
                },
                pickupDate: pickupDateTime,
                pickupTime, // Store as string for display
                pickupAddress,
                pickupContactName,
                pickupContactPhone,
                pickupInstructions,
                totalPieces: parseInt(totalPieces),
                orderWeight: parseFloat(orderWeight),
                dropoffAddress,
                dropoffContactName,
                dropoffContactPhone,
                dropoffInstructions,
                status: OrderStatus.PENDING
            },
        });

        return NextResponse.json({ success: true, orderId: order.id });
    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json({ error: 'Failed to create order: ' + (error as Error).message }, { status: 500 });
    }
}