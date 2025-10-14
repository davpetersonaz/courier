// src/app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await prisma.customer.findUnique({
            where: { email: session.user.email },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                address: true,
                city: true,
                state: true,
                zip: true,
                phone: true
            }, // Exclude password
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const user = await prisma.customer.update({
            where: { email: session.user.email },
            data: {
                email: body.email,
                firstName: body.firstName,
                lastName: body.lastName,
                address: body.address,
                city: body.city,
                state: body.state,
                zip: body.zip,
                phone: body.phone
            },
            select: { id: true }, // Just return id or full user as needed
        });
        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}