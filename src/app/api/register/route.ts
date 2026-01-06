// src/app/api/register/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
    const { username, email, password, firstName, lastName, address, city, state, zip, phone } = await request.json();
    try {
        // Check if username or email already exists
        const existingUser = await prisma.user.findFirst({
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
        await prisma.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                firstName,
                lastName,
                address,
                city,
                state,
                zip,
                phone
            },
        });

        return NextResponse.redirect(new URL('/?registered=true', request.url));
    } catch (err) {
        console.error('error in api/register/route', err);
        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        );
    }
}