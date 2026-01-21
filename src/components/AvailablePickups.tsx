// src/components/AvailablePickups.tsx
'use client';
import { useState } from 'react';
import { useLoadScript, GoogleMap, DirectionsRenderer } from '@react-google-maps/api';

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
    }>;
    courierAddress: string;
}

export default function AvailablePickups({ orders, courierAddress }: AvailablePickupsProps) {
    const [selected, setSelected] = useState<number[]>([]);
    const [optimizedSequence, setOptimizedSequence] = useState<string[]>([]);
    const [optimizedRoute, setOptimizedRoute] = useState<google.maps.DirectionsResult | null>(null);

    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places']
    });

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

    const generateRoute = () => {
        if (selected.length === 0) return;

        // Collect pickups and dropoffs separately
        const pickups = selected
            .map(id => orders.find(o => o.id === id)?.pickupAddress)
            .filter((addr): addr is string => !!addr);

        const dropoffs = selected
            .map(id => orders.find(o => o.id === id)?.dropoffAddress)
            .filter((addr): addr is string => !!addr);

        if (pickups.length === 0 || dropoffs.length === 0) {
            alert('Missing pickup or dropoff addresses for selected orders');
            return;
        }

        // Use Directions API for optimization
        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: courierAddress,
                destination: dropoffs[dropoffs.length - 1], // last dropoff as final stop
                waypoints: [
                    // Optimize pickups among themselves (all but last)
                    ...pickups.slice(0, -1).map(location => ({ location, stopover: true })),
                    // Optimize dropoffs among themselves (all but last)
                    ...dropoffs.slice(0, -1).map(location => ({ location, stopover: true })),
                ],
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING,
                drivingOptions: {
                    departureTime: new Date(), // current time for traffic
                    trafficModel: 'pessimistic' as google.maps.TrafficModel,
                },
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    // Extract the optimized sequence for display
                    const orderedWaypoints = result.routes[0].waypoint_order.map(i => {
                        const allWaypoints = [...pickups.slice(0, -1), ...dropoffs.slice(0, -1)];
                        return allWaypoints[i];
                    });

                    const fullSequence = [
                        courierAddress,                        // Start
                        ...pickups.slice(0, -1),               // Optimized pickups (except last)
                        pickups[pickups.length - 1],           // Last pickup (fixed before dropoffs)
                        ...orderedWaypoints.filter(a => dropoffs.slice(0, -1).includes(a)), // Optimized dropoffs
                        dropoffs[dropoffs.length - 1],         // Final stop
                    ].filter(Boolean);
                    setOptimizedSequence(fullSequence);
                    setOptimizedRoute(result);

                    // Open Google Maps with the same optimized order
                    const waypointsParam = orderedWaypoints.map(encodeURIComponent).join('|');
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(courierAddress)}&destination=${encodeURIComponent(dropoffs[dropoffs.length - 1])}&waypoints=${waypointsParam}&travelmode=driving&optimize=true`;
                    window.open(url, '_blank');
                } else {
                    alert(`Could not generate route: ${status}`);
                }
            }
        );
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
                                {orders.map(order => (
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
                            disabled={selected.length === 0}
                            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Generate Optimized Route ({selected.length} selected)
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
                    {isLoaded ? (
                        optimizedRoute ? (
                            <div className="mt-6 border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                                <GoogleMap
                                    mapContainerStyle={{ width: '100%', height: '100%' }}
                                    center={{ lat: 33.4484, lng: -112.0740 }} // Phoenix fallback
                                    zoom={11}
                                >
                                    <DirectionsRenderer directions={optimizedRoute} />
                                </GoogleMap>
                            </div>
                        ) : null
                    ) : loadError ? (
                        <p className="p-4 text-red-600">Failed to load Google Maps: {loadError.message}</p>
                    ) : null}
                </>
            )}
        </section>
    );
}