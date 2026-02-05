// src/app/api/recipients/route.ts
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET() {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const recipients = await prisma.recipient.findMany({
            where: { userId: user.id },
            orderBy: { timesUsed: 'desc' }, // Most used first
        });

        return NextResponse.json({ recipients });
    } catch (error) {
        console.error('Error fetching recipients:', error);
        return NextResponse.json({ error: 'Failed to fetch recipients' }, { status: 500 });
    }
}