// src/components/AvailablePickups.tsx
'use client';
import { useState } from 'react';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { OrderWithCustomer } from '@/types/order';
import { OrderStatus } from '@/lib/order-status';

interface AvailablePickupsProps {
    orders: Array<{
        id: number;
        customer: { firstName: string; lastName: string | null; phone: string };
        pickupDate: Date;
        pickupTime: string;
        pickupAddress: string;
        dropoffAddress: string;
        totalPieces: number;
        orderWeight: number;
        status: OrderStatus;
    }>;
    courierAddress: string;
}

export default function AvailablePickups({ orders, courierAddress }: AvailablePickupsProps) {
    const [selected, setSelected] = useState<number[]>([]);
    const [optimizedSequence, setOptimizedSequence] = useState<string[]>([]);
    const [optimizedRoute, setOptimizedRoute] = useState<google.maps.DirectionsResult | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const toggleSelect = (id: number) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const acceptJob = async (orderId: number) => {
        try {
            const res = await fetch('/api/orders/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, status: 'EN_ROUTE_PICKUP' }),
            });
            if (res.ok) {
                alert('Job accepted!');
                window.location.reload(); // refresh to update UI
            } else {
                alert('Failed to accept job');
            }
        } catch (err) {
            console.error('error in AvailablePickups', err);
            alert('Error accepting job');
        }
    };

    const generateRoute = async () => {
        if (selected.length === 0) return;
        setIsGenerating(true);

        try{
            // Collect pickups and dropoffs separately
            const selectedOrders = selected
                .map(id => orders.find(o => o.id === id))
                .filter((o): o is NonNullable<typeof o> => !!o);
            const pickups = selectedOrders.map(o => o.pickupAddress).filter(Boolean);
            const dropoffs = selectedOrders.map(o => o.dropoffAddress).filter(Boolean);
            if (pickups.length === 0 || dropoffs.length === 0) {
                alert('Missing pickup or dropoff addresses for selected orders');
                return;
            }

            // Use Directions API for optimization
            const directionsService = new google.maps.DirectionsService();

            // Step 1: Optimize pickups (courier → all pickups → first dropoff anchor)
            const pickupResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route(
                    {
                        origin: courierAddress,
                        destination: dropoffs[0],
                        waypoints: pickups.map(loc => ({ location: loc, stopover: true })),
                        optimizeWaypoints: true,
                        travelMode: google.maps.TravelMode.DRIVING,
                        drivingOptions: {
                            departureTime: new Date(),
                            trafficModel: 'pessimistic' as google.maps.TrafficModel,
                        },
                    },
                    (result, status) => (status === google.maps.DirectionsStatus.OK && result ? resolve(result) : reject(status))
                );
            });
            const optimizedPickupOrder = pickupResponse.routes[0].waypoint_order.map(i => pickups[i]);

            // Step 2: Optimize dropoffs (last pickup → all dropoffs)
            const dropoffResponse = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
                directionsService.route(
                    {
                        origin: optimizedPickupOrder[optimizedPickupOrder.length - 1] || courierAddress,
                        destination: dropoffs[dropoffs.length - 1],
                        waypoints: dropoffs.slice(0, -1).map(loc => ({ location: loc, stopover: true })),
                        optimizeWaypoints: true,
                        travelMode: google.maps.TravelMode.DRIVING,
                        drivingOptions: {
                            departureTime: new Date(),
                            trafficModel: 'pessimistic' as google.maps.TrafficModel,
                        },
                    },
                    (result, status) => (status === google.maps.DirectionsStatus.OK && result ? resolve(result) : reject(status))
                );
            });
            const optimizedDropoffOrder = dropoffResponse.routes[0].waypoint_order.map(i => dropoffs.slice(0, -1)[i]);

            // Build full sequence
            const fullSequence = [
                courierAddress,
                ...optimizedPickupOrder,
                ...optimizedDropoffOrder,
                dropoffs[dropoffs.length - 1],
            ].filter(Boolean);
            setOptimizedSequence(fullSequence);

            // Combine into one DirectionsResult for rendering
            const combinedRoute: google.maps.DirectionsResult = {
                ...pickupResponse, // keep everything from pickup (request, status, etc.)
                routes: [{
                    ...pickupResponse.routes[0],
                    legs: [
                        ...pickupResponse.routes[0].legs,
                        ...dropoffResponse.routes[0].legs,
                    ],
                    // Keep pickup's waypoint_order (dropoffs are appended after, so no need to merge orders)
                    waypoint_order: pickupResponse.routes[0].waypoint_order,
                    // Add other required props if TS complains (rare)
                    bounds: pickupResponse.routes[0].bounds || dropoffResponse.routes[0].bounds,
                    copyrights: pickupResponse.routes[0].copyrights,
                    overview_path: pickupResponse.routes[0].overview_path,
                    overview_polyline: pickupResponse.routes[0].overview_polyline,
                    summary: pickupResponse.routes[0].summary,
                    warnings: pickupResponse.routes[0].warnings,
                }],
            };
            setOptimizedRoute(combinedRoute);

            // Open Google Maps link with optimized order
            const waypointsParam = fullSequence
                .slice(1, -1) // exclude start/end
                .map(encodeURIComponent)
                .join('|');
            const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(courierAddress)}&destination=${encodeURIComponent(dropoffs[dropoffs.length - 1])}&waypoints=${waypointsParam}&travelmode=driving&optimize=true`;
            window.open(url, '_blank');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            alert(`Route generation failed: ${message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <section className="bg-white rounded-lg shadow overflow-hidden">
            {orders.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                    No pending pickups right now. Check back soon!
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-center w-10"><input type="checkbox" disabled /></th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Order ID</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Customer</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 hidden md:table-cell">Pickup Time</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Pickup Address</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 hidden lg:table-cell">Dropoff</th>
                                    <th className="px-4 py-3 font-medium text-gray-700">Details</th>
                                    <th className="px-4 py-3 font-medium text-gray-700 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {orders.map((order: OrderWithCustomer) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(order.id)}
                                                onChange={() => toggleSelect(order.id)}
                                                className="h-5 w-5 text-blue-600 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-4 font-medium">#{order.id}</td>
                                        <td className="px-4 py-4">
                                            {order.customer.firstName} {order.customer.lastName || ''}
                                            <p className="text-xs text-gray-500">{order.customer.phone}</p>
                                        </td>
                                        <td className="px-4 py-4 hidden md:table-cell">
                                            {new Date(order.pickupDate).toLocaleDateString()} <br />
                                            <span className="font-medium">{order.pickupTime}</span>
                                        </td>
                                        <td className="px-4 py-4 text-xs md:text-sm hidden lg:table-cell">
                                            {order.pickupAddress}
                                        </td>
                                        <td className="px-4 py-4 text-xs md:text-sm hidden lg:table-cell">
                                            {order.dropoffAddress}
                                        </td>
                                        <td className="px-4 py-4 text-xs">
                                            {order.totalPieces} pcs • {order.orderWeight} lbs
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <button
                                                onClick={() => acceptJob(order.id)}
                                                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                            >
                                                Accept Job
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Route Button */}
                    <div className="p-4 bg-gray-50 border-t flex justify-end">
                        <button
                            onClick={generateRoute}
                            disabled={selected.length === 0 || isGenerating}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? 'Generating Route...' : `Generate Optimized Route (${selected.length} selected)`}
                        </button>
                    </div>

                    {/* Optimized Sequence List */}
                    {optimizedSequence.length > 0 && (
                        <div className="p-6 bg-gray-50 border-t">
                            <h3 className="text-lg font-semibold mb-3">Optimized Route Sequence:</h3>
                            <ol className="list-decimal pl-6 space-y-2 text-sm">
                                {optimizedSequence.map((addr, idx) => (
                                    <li key={idx}>
                                        {addr}
                                        {idx === 0 && ' (Start - Your Location)'}
                                        {idx === optimizedSequence.length - 1 && ' (Final Delivery)'}
                                    </li>
                                ))}
                            </ol>
                        </div>
                    )}

                    {/* Embedded Map */}
                    {optimizedRoute ? (
                        <div className="mt-6 border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={{ lat: 33.4484, lng: -112.0740 }}
                                zoom={11}
                            >
                                <DirectionsRenderer directions={optimizedRoute} />
                            </GoogleMap>
                        </div>
                    ) : selected.length > 0 ? (
                        <p className="text-center text-gray-600 py-4">Click &quot;Generate Optimized Route&quot; to see preview</p>
                    ) : null}
                </>
            )}
        </section>
    );
}