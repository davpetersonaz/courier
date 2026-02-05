// src/app/api/user/password/route.ts
import { NextResponse } from 'next/server';

import bcrypt from 'bcrypt';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { oldPassword, newPassword } = await request.json();
    if (!oldPassword || !newPassword) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { password: true },
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const isValid = await bcrypt.compare(oldPassword, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
        }

        const hashedNew = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedNew },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('caught error in api/user/password', error);
        return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }
}