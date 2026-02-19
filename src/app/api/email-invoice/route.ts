import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const pdf = formData.get('pdf') as File;
    const start = formData.get('start') as string;
    const end = formData.get('end') as string;

    const pdfBuffer = await pdf.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');

    const orderIdsRaw = formData.get('orderIds') as string;
    const orderIds = JSON.parse(orderIdsRaw) as number[];
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
        return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
    }

    // Send with Resend (get API key from resend.com)
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'SpeedyCourier <no-reply@yourdomain.com>',
            to: 'friend@example.com', // Replace with actual customer email later
            subject: `Invoice: ${start} to ${end}`,
            text: 'Attached is your SpeedyCourier invoice.',
            attachments: [
                {
                    content: pdfBase64,
                    filename: `SpeedyCourier_Invoice_${start}_to_${end}.pdf`,
                },
            ],
        }),
    });

    if (!res.ok) {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { invoiceSentAt: new Date() },
    });

    return NextResponse.json({ success: true });
}