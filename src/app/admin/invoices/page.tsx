// src/app/admin/invoices/page.tsx
import { redirect } from 'next/navigation';

import { format } from 'date-fns';

import { AdminInvoiceTableClient } from '@/components/AdminInvoiceTableClient';
import { DateRangePicker } from '@/components/DateRangePicker';
import { InvoiceExportButton } from '@/components/InvoiceExportButton';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }>; }) {
    const session = await auth();
    if (!session) { redirect('/login'); }
    if (session.user?.role !== 'ADMIN') { redirect('/'); }

    const params = await searchParams;
    const today = new Date();
    const defaultStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const defaultEnd = today;
    const startDate = params.start ? new Date(params.start) : defaultStart;
    const endDate = params.end ? new Date(params.end) : defaultEnd;

    // Validate dates (prevent invalid ranges)
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate > endDate) {
        // Fallback to defaults if bad params
        return redirect('/admin/invoices');
    }

    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: startDate, lte: endDate },
            // customerId: 1, // ← hardcode user ID, or make dynamic later
        },
        include: {
            customer: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
    });

    const totalAmount = orders.reduce((sum, o) => {
        // Simple fixed pricing for now - adjust as needed
        const price = o.pickupDate.getHours() < 9 ? 15.99 : 12.99;
        return sum + price;
    }, 0);

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Invoices</h1>

                <DateRangePicker
                    defaultStart={format(startDate, 'yyyy-MM-dd')}
                    defaultEnd={format(endDate, 'yyyy-MM-dd')}
                />

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">
                            Summary ({format(startDate, 'MMM d')} – {format(endDate, 'MMM d, yyyy')})
                        </h2>
                        <div className="text-right">
                            <p className="text-xl font-bold">Total: ${totalAmount.toFixed(2)}</p>
                            <p className="text-sm text-gray-500">{orders.length} deliveries</p>
                        </div>
                    </div>

                    {orders.length === 0 ? (
                        <p className="text-center text-gray-600 py-8">No deliveries in this period.</p>
                    ) : (
                        <>
                            <AdminInvoiceTableClient orders={orders} />
                            <div className="flex justify-end mt-6">
                                <InvoiceExportButton
                                    orders={orders}
                                    startDate={startDate}
                                    endDate={endDate}
                                    totalAmount={totalAmount}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}