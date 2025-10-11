// src/app/history/page.tsx
import prisma from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route"; // Adjust path if needed
import { Order, OrderHistory } from '.prisma/client';

export default async function History() {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
                <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 text-center">
                    Please log in to view order history.
                </div>
            </div>
        );
    }

    const orders = await prisma.order.findMany({
        where: { customerId: parseInt(session.user.id) },
        include: { history: true },
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
            <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-6">Order History for {session.user.username}</h1>
                <ul className="space-y-4">
                    {orders.map((order: Order & { history: OrderHistory[] }) => (
                        <li key={order.id} className="border-2 border-gray-300 p-4 rounded-md">
                            {order.pickupAddress} to {order.dropoffAddress} - Status: {order.status}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}