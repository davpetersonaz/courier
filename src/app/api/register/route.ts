// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    const { username, email, password, firstName, lastName, address, phone } = await request.json();
    try {
        // Check if username or email already exists
        const existingUser = await prisma.customer.findFirst({
            where: {
                OR: [{ username }, { email }],
            },
        });
        if (existingUser) {
            return NextResponse.json(
                { error: 'Username or email already exists' }, 
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        await prisma.customer.create({
            data: {
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                address,
                phone
            },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json(
            { error: 'Failed to register user' }, 
            { status: 500 }
        );
    }
}