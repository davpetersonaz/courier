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

    let userId: number;
    try {
        // Always query user by email to get ID (consistent with /api/user)
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        userId = user.id;
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
            saveRecipient = false
        } = body;

        // Validate required fields
        if (!pickupDate || !pickupTime || !pickupAddress || !dropoffAddress) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate numbers
        const pieces = parseInt(totalPieces);
        const weight = parseFloat(orderWeight);
        if (isNaN(pieces) || isNaN(weight)) {
            return NextResponse.json({ error: 'Invalid total pieces or weight' }, { status: 400 });
        }

        // Combine date and time into pickupDateTime
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00`);
        if (isNaN(pickupDateTime.getTime())) {
            return NextResponse.json({ error: 'Invalid date or time' }, { status: 400 });
        }

        const order = await prisma.order.create({
            data: {
                customer: {
                    connect: { id: userId } // Explicit relation connect
                },
                pickupDate: pickupDateTime,
                pickupTime, // Store as string for display
                pickupAddress,
                pickupContactName,
                pickupContactPhone,
                pickupInstructions,
                totalPieces: pieces,
                orderWeight: weight,
                dropoffAddress,
                dropoffContactName,
                dropoffContactPhone,
                dropoffInstructions,
                status: OrderStatus.PENDING
            },
        });

        if (saveRecipient && dropoffContactName && dropoffAddress) {
            await prisma.recipient.upsert({
                where: {
                    userId_address_name: {
                        userId, // the logged-in user
                        address: dropoffAddress,
                        name: dropoffContactName || 'Unnamed Recipient',
                    },
                },
                update: {
                    contactPhone: dropoffContactPhone || null,
                    instructions: dropoffInstructions || null,
                    timesUsed: { increment: 1 },
                },
                create: {
                    userId,
                    name: dropoffContactName || 'Unnamed Recipient',
                    address: dropoffAddress,
                    contactName: dropoffContactName || null,
                    contactPhone: dropoffContactPhone || null,
                    instructions: dropoffInstructions || null,
                    timesUsed: 1,
                },
            });
        }

        return NextResponse.json({ success: true, orderId: order.id });
    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create order: ' + (error as Error).message }, 
            { status: 500 }
        );
    }
}