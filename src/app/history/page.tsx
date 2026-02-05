// src/app/history/page.tsx
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { OrderStatus } from '@/lib/order-status';
import { formatPhone } from '@/lib/utils';
import { ExtendedOrder } from '@/types/order';

import ClientHistory from './ClientHistory';

export default async function History() {
    const session = await auth();
    if(!session){ redirect('/'); }

    //session exists, but user or role is missing → treat as regular customer
    if (session.user?.role === 'COURIER') {
        // Couriers use the dedicated dashboard
        redirect('/courier/dashboard');
    }

    // Customers see only their own orders
    const orders: ExtendedOrder[] = await prisma.order.findMany({
        where: { customerId: parseInt(session.user.id) },
        include: {
            customer: { // ← Add this block
                select: { firstName: true, lastName: true, phone: true },
            },
            courier: {
                select: { firstName: true, lastName: true },
            },
            history: {
                orderBy: { updatedAt: 'asc' }, // Chronological order
                include: {
                    changedBy: {
                        select: { firstName: true, lastName: true }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <ClientHistory>
            <div className="min-h-screen p-4 bg-gray-100">
                <div className="min-h-screen p-4 bg-gray-100">
                    <div className="max-w-6xl mx-auto">
                        <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">
                            Order History - {session.user.name}
                        </h1>
                        <p className="text-center text-sm text-gray-500 mb-8">
                            Last updated: {new Date().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                            })}
                        </p>
                        {orders.length === 0 ? (
                            <p className="p-8 text-center text-gray-500 bg-white rounded-lg shadow">No orders yet.</p>
                        ) : (
                            <div className="space-y-8">
                                {orders.map((order) => (
                                    <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-2xl font-semibold">Order #{order.id}</h2>
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                order.status === OrderStatus.PENDING ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === OrderStatus.DELIVERED ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {order.status.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            <div>
                                                <p className="font-medium">Pickup</p>
                                                <p>{order.pickupAddress}</p>
                                                <p className="text-sm text-gray-600">
                                                    {new Date(order.pickupDate).toLocaleDateString()} at {order.pickupTime}
                                                </p>
                                                {order.pickupContactName && order.pickupContactPhone &&
                                                    <p>Contact: {order.pickupContactName} ({formatPhone(order.pickupContactPhone)})</p>
                                                }
                                            </div>
                                            <div>
                                                <p className="font-medium">Dropoff</p>
                                                <p>{order.dropoffAddress}</p>
                                                {order.dropoffContactName && order.dropoffContactName && 
                                                    <p>Contact: {order.dropoffContactName} ({formatPhone(order.dropoffContactPhone)})</p>
                                                }
                                            </div>
                                        </div>

                                        <div>
                                            <p className="font-medium mb-2">Status History</p>
                                            <div className="space-y-2">
                                                {order.history?.length === 0 ? (
                                                    <p className="text-sm text-gray-500">No status updates yet</p>
                                                ) : (
                                                    order.history!.map((entry) => (
                                                        <div key={entry.id} className="flex items-center space-x-2 text-sm">
                                                            <span className="text-gray-600">
                                                                {new Date(entry.updatedAt).toLocaleString()}
                                                            </span>
                                                            <span className="font-medium">
                                                                → {entry.status.replace(/_/g, ' ')}
                                                            </span>
                                                            {entry.changedBy && (
                                                                <span className="text-xs text-blue-600">
                                                                    by {entry.changedBy.firstName} {entry.changedBy.lastName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ClientHistory>
    );
}