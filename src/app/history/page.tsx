// src/app/history/page.tsx
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';
import { Order, OrderHistory } from '@prisma/client';
import { redirect } from 'next/navigation';

type ExtendedOrder = Order & {
    history: OrderHistory[];
}

export default async function History() {
    const session = await auth();
    console.log('Session:', session); // ← Add this
    console.log('User role:', session?.user?.role); // ← Add this
    if(!session){ redirect('/'); }

    //session exists, but user or role is missing → treat as regular customer
    if (session.user?.role === 'COURIER') {
        // Couriers use the dedicated dashboard
        redirect('/courier/dashboard');
    }

    // Customers see only their own orders
    const orders: ExtendedOrder[] = await prisma.order.findMany({
        where: { customerId: parseInt(session.user.id) },
        include: { history: true },
        orderBy: { createdAt: 'desc' },
    });

    const pendingOrders = orders.filter(o => o.status === 'pending');
    const completedOrders = orders.filter(o => o.status === 'delivered'); // or 'completed'

    return (
        <div className="min-h-screen p-4 bg-gray-100">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                    Order History - {session.user.username}
                </h1>
                <div className="bg-white rounded-lg shadow-md">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Pending Orders ({pendingOrders.length})
                        </div>
                        <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Completed Orders ({completedOrders.length})
                        </div>
                    </div>
                    {/* Table */}
                    {orders.length === 0 ? (
                        <p className="p-8 text-center text-gray-500">No orders yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dropoff Address</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Date(order.pickupDate).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{order.pickupAddress}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{order.dropoffAddress}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}