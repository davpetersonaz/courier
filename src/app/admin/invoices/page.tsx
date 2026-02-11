// src/app/admin/invoices/page.tsx
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ start?: string; end?: string }>; }) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN'){ redirect('/'); }

    const params = await searchParams;
    const today = new Date();
    const start = params.start ? new Date(params.start) : new Date(today.setDate(today.getDate() - 7));
    const end = params.end ? new Date(params.end) : today;

    const orders = await prisma.order.findMany({
        where: {
            createdAt: { gte: start, lte: end },
            customerId: 1, // ← hardcode your friend's user ID for now, or make dynamic later
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
                <h1 className="text-3xl font-bold mb-6">Weekly Invoices</h1>

                {/* Date range picker - simple for MVP */}
                <form className="mb-8 flex gap-4 items-end">
                    <div>
                        <label className="block text-sm mb-1">Start Date</label>
                        <input
                            type="date"
                            name="start"
                            defaultValue={format(start, 'yyyy-MM-dd')}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm mb-1">End Date</label>
                        <input
                            type="date"
                            name="end"
                            defaultValue={format(end, 'yyyy-MM-dd')}
                            className="border rounded px-3 py-2"
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                        Generate
                    </button>
                </form>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">
                            Invoice Summary ({format(start, 'MMM d')} – {format(end, 'MMM d, yyyy')})
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
                            <table className="w-full text-left mb-6">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3">Order #</th>
                                        <th className="px-4 py-3">Date / Time</th>
                                        <th className="px-4 py-3">Pickup → Dropoff</th>
                                        <th className="px-4 py-3">Pieces / Weight</th>
                                        <th className="px-4 py-3 text-right">Charge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.map((order) => {
                                        const price = order.pickupDate.getHours() < 9 ? 15.99 : 12.99;
                                        return (
                                            <tr key={order.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">#{order.id}</td>
                                                <td className="px-4 py-3">
                                                    {format(order.pickupDate, 'MMM d, yyyy')} at {order.pickupTime}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.pickupAddress} → {order.dropoffAddress}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.totalPieces} pcs / {order.orderWeight} lbs
                                                </td>
                                                <td className="px-4 py-3 text-right">${price.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="flex justify-end">
                                <button className="bg-green-600 text-white px-6 py-3 rounded hover:bg-green-700">
                                    Export PDF / Email Invoice
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}