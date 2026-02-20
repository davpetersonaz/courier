// src/app/api/email-invoice/route.ts
import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: Request) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const pdfFile = formData.get('pdf') as File | null;
        const start = formData.get('start') as string;
        const end = formData.get('end') as string;
        const orderIdsRaw = formData.get('orderIds') as string;
        if (!pdfFile || !start || !end || !orderIdsRaw) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const orderIds = JSON.parse(orderIdsRaw) as number[];
        if (!Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ error: 'No orders selected' }, { status: 400 });
        }

        // Fetch the orders + their customer
        const orders = await prisma.order.findMany({
            where: { id: { in: orderIds } },
            include: {
                customer: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (orders.length !== orderIds.length) {
            return NextResponse.json({ error: 'One or more orders not found' }, { status: 404 });
        }

        // Ensure all orders belong to the same customer (enforce single-customer batch)
        const customerEmails = [...new Set(orders.map(o => o.customer.email))];
        if (customerEmails.length !== 1 || !customerEmails[0]) {
            return NextResponse.json(
                { error: 'Orders belong to multiple customers or no email found. Please filter by one client.' },
                { status: 400 }
            );
        }

        const customerEmail = customerEmails[0];
        const customerName = `${orders[0].customer.firstName ?? ''} ${orders[0].customer.lastName ?? ''}`.trim() || 'Customer';

        // Prepare PDF attachment
        const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());
        const pdfBase64 = pdfBuffer.toString('base64');

        // Calculate total in backend too (for consistency / display in email)
        const total = orders.reduce((sum, o) => {
            const price = o.pickupDate.getHours() < 9 ? 15.99 : 12.99;
            return sum + price;
        }, 0);

        // Send with Resend (get API key from resend.com)
        const resendResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'SpeedyCourier <no-reply@yourdomain.com>', // TODO: change this to my real domain (when we have one)
                to: customerEmail,
                subject: `Your SpeedyCourier Invoice – ${start} to ${end}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h1 style="color: #3b82f6;">Invoice Ready</h1>
                        <p>Dear ${customerName},</p>
                        <p>Thank you for choosing SpeedyCourier. Attached is your invoice for deliveries between <strong>${start}</strong> and <strong>${end}</strong>.</p>
                        <p><strong>Total Amount:</strong> $${total.toFixed(2)}</p>
                        <p><strong>Number of deliveries:</strong> ${orders.length}</p>
                        <p>If you have any questions, feel free to reply to this email or call us.</p>
                        <p style="margin-top: 30px; color: #6b7280; font-size: 0.9em;">
                            SpeedyCourier - Fast, Reliable Delivery
                        </p>
                    </div>
                `,
                attachments: [
                    {
                        content: pdfBase64,
                        filename: `SpeedyCourier_Invoice_${start}_to_${end}.pdf`,
                    },
                ],
            }),
        });
        if (!resendResponse.ok) {
            const errorData = await resendResponse.json();
            console.error('Resend failed:', errorData);
            return NextResponse.json(
                { error: 'Failed to send email', details: errorData.message || 'Unknown error' },
                { status: 500 }
            );
        }

        await prisma.order.updateMany({
            where: { id: { in: orderIds } },
            data: { invoiceSentAt: new Date() },
        });

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Email invoice route error:', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}