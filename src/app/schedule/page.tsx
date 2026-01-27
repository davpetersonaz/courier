// src/app/schedule/page.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { useLoadScript } from '@react-google-maps/api';
import { Autocomplete } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface OrderFormData {
    pickupDate: string;
    pickupTime: string;
    pickupAddress: string;
    pickupContactName: string;
    pickupContactPhone: string;
    pickupInstructions: string;
    totalPieces: string;
    orderWeight: string;
    dropoffAddress: string;
    dropoffContactName: string;
    dropoffContactPhone: string;
    dropoffInstructions: string;
}

interface Recipient {
    id: number;
    name: string;
    address: string;
    contactName: string | null;
    contactPhone: string | null;
    instructions: string | null;
}

const mapContainerStyle = {
    width: '100%',
    height: '400px',
};

export default function Schedule() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState<OrderFormData>({
        pickupDate: new Date().toISOString().split('T')[0], // Default to today
        pickupTime: new Date().toTimeString().slice(0, 5), // Default to current time (HH:MM)
        pickupAddress: '',
        pickupContactName: '',
        pickupContactPhone: '',
        pickupInstructions: '',
        totalPieces: '',
        orderWeight: '',
        dropoffAddress: '',
        dropoffContactName: '',
        dropoffContactPhone: '',
        dropoffInstructions: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [saveRecipient, setSaveRecipient] = useState(false);
    const [recipients, setRecipients] = useState<Recipient[]>([]);
    const [loadingRecipients, setLoadingRecipients] = useState(true);

    // map states
    const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [dropoffCoords, setDropoffCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [mapError, setMapError] = useState<string | null>(null);
    const [pickupVerified, setPickupVerified] = useState<string | null>(null);
    const [dropoffVerified, setDropoffVerified] = useState<string | null>(null);
    const pickupAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const dropoffAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const pickupInputRef = useRef<HTMLInputElement>(null);
    const dropoffInputRef = useRef<HTMLInputElement>(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
        preventGoogleFontsLoading: true
    });

    useEffect(() => {
        const suppressBraveSuggestions = (input: HTMLInputElement | null) => {
            if (!input) return;
            const onFocus = () => {
                input.setAttribute('readonly', 'readonly');
                input.blur(); // force blur to kill popup
                setTimeout(() => {
                    input.focus();
                    setTimeout(() => {
                        input.removeAttribute('readonly');
                        input.focus(); // double focus to ensure
                    }, 30);
                }, 30);
            };
            input.addEventListener('focus', onFocus);
            return () => input.removeEventListener('focus', onFocus);
        };
        suppressBraveSuggestions(pickupInputRef.current);
        suppressBraveSuggestions(dropoffInputRef.current);
    }, []);

    // Clear verification badge if user edits after verify
    useEffect(() => {
        if (pickupVerified && formData.pickupAddress !== pickupVerified) {
            setPickupVerified(null);
        }
    }, [formData.pickupAddress, pickupVerified]);

    useEffect(() => {
        if (dropoffVerified && formData.dropoffAddress !== dropoffVerified) {
            setDropoffVerified(null);
        }
    }, [formData.dropoffAddress, dropoffVerified]);

    // Fetch recipients
    useEffect(() => {
        if (status === 'authenticated') {
            fetchRecipients();
        } else if (status === 'unauthenticated') {
            router.push('/');
        }
    }, [status, router]);

    // Route preview (no pricing)
    useEffect(() => {
        if (!pickupCoords || !dropoffCoords) {
            setDirections(null);
            setMapError(null);
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: pickupCoords,
                destination: dropoffCoords,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                    setMapError(null);
                } else {
                    setDirections(null);
                    setMapError('Could not calculate route: ' + status);
                }
            }
        );
    }, [pickupCoords, dropoffCoords]);

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!session) {
        router.push('/');
        return null;
    }

    const fetchRecipients = async () => {
        try {
            const res = await fetch('/api/recipients');
            if (res.ok) {
                const data = await res.json();
                setRecipients(data.recipients || []);
            }
        } catch (err) {
            console.error('Failed to load recipients:', err);
        } finally {
            setLoadingRecipients(false);
        }
    };

    const handleRecipientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const recipientId = parseInt(e.target.value);
        if (recipientId === 0) {
            // "Select a saved recipient" option
            setFormData(prev => ({
                ...prev,
                dropoffAddress: '',
                dropoffContactName: '',
                dropoffContactPhone: '',
                dropoffInstructions: '',
            }));
            return;
        }

        const recipient = recipients.find(r => r.id === recipientId);
        if (recipient) {
            setFormData(prev => ({
                ...prev,
                dropoffAddress: recipient.address,
                dropoffContactName: recipient.contactName || recipient.name,
                dropoffContactPhone: recipient.contactPhone || '',
                dropoffInstructions: recipient.instructions || '',
            }));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.pickupTime || !formData.totalPieces || !parseFloat(formData.orderWeight)) {
            alert('Please fill in pickup time, total pieces, and order weight.');
            return;
        }
        if (!pickupCoords || !dropoffCoords) {
            alert('Please verify both addresses before submitting.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                body: JSON.stringify({ ...formData, saveRecipient }),
                headers: { 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                alert('Order scheduled successfully!');
                router.push('/history');
            } else {
                const data = await res.json().catch(() => ({}));
                alert('Failed: ' + (data.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Network Error: ' + String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClear = () => {
        setFormData({
            pickupDate: new Date().toISOString().split('T')[0],
            pickupTime: new Date().toTimeString().slice(0, 5),
            pickupAddress: '',
            pickupContactName: '',
            pickupContactPhone: '',
            pickupInstructions: '',
            totalPieces: '',
            orderWeight: '',
            dropoffAddress: '',
            dropoffContactName: '',
            dropoffContactPhone: '',
            dropoffInstructions: '',
        });
        setPickupCoords(null);
        setDropoffCoords(null);
        setDirections(null);
        setPickupVerified(null);
        setDropoffVerified(null);
        setMapError(null);
    };

    // Time/date restrictions
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const isBefore9AM = currentHour < 9;

    // Same-day only if date = today AND time < 9 AM
    const deliveryType = (isBefore9AM ? 'Same-Day' : 'Next-Day');

    // Min date: today only if before 9 AM, otherwise tomorrow
    const minDate = todayStr;

    // Min time: on today, can't pick past current time
    const isToday = (formData.pickupDate === todayStr);
    const minTime = (isToday ? now.toTimeString().slice(0, 5) : '00:00');

    // Price (fixed)
    const price = isBefore9AM ? 15.99 : 12.99;

    return (
        <div className="min-h-screen p-4 bg-gray-100">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Schedule a Pickup</h1>
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">

                    {/* Pickup Pane */}
                    <div className="border border-gray-300 p-6 rounded-md">
                        <h2 className="text-2xl font-semibold mb-4">Pickup Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="pickupDate" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Date
                                </label>
                                <input
                                    id="pickupDate"
                                    name="pickupDate"
                                    type="date"
                                    value={formData.pickupDate}
                                    onChange={handleChange}
                                    min={minDate}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                                {!isBefore9AM && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Earliest available: {new Date(now.setDate(now.getDate() + 1)).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Time
                                </label>
                                <input
                                    id="pickupTime"
                                    name="pickupTime"
                                    type="time"
                                    value={formData.pickupTime}
                                    onChange={handleChange}
                                    min={minTime}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            {!isBefore9AM && (
                                <p className="mt-2 text-sm text-yellow-600 md:col-span-2 text-center">
                                    Same-day delivery is only available for orders placed before 9:00 AM. This will be scheduled as next-day.
                                </p>
                            )}
                            <div className="md:col-span-2 relative">
                                <label htmlFor="pu-loc" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Address
                                </label>
                                {isLoaded ? (
                                    <Autocomplete
                                        onLoad={(autocomplete) => {
                                            pickupAutocompleteRef.current = autocomplete;
                                        }}
                                        onPlaceChanged={() => {
                                            const input = pickupInputRef.current;
                                            if (input) {
                                                const place = pickupAutocompleteRef.current?.getPlace();
                                                if (place?.formatted_address && place.geometry?.location) {
                                                    input.value = place.formatted_address; // direct DOM set
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        pickupAddress: place.formatted_address!,  // ! tells TS it's definitely string
                                                    }));
                                                    setPickupCoords({
                                                        lat: place.geometry.location.lat(),
                                                        lng: place.geometry.location.lng(),
                                                    });
                                                    setPickupVerified(place.formatted_address);
                                                }
                                            }
                                        }}
                                        options={{
                                            types: ['address'], // restrict to full addresses
                                            componentRestrictions: { country: 'us' }, // optional: US only
                                        }}
                                    >
                                        <input
                                            id="pu-loc"
                                            name="pu-loc-field"
                                            ref={pickupInputRef}
                                            type="text"
                                            defaultValue={formData.pickupAddress}
                                            onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                                            onBlur={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                                            placeholder="Start typing the pickup location..."
                                            autoComplete="off new-password"
                                            autoCorrect="off"                     // macOS/iOS
                                            spellCheck="false"                    // extra layer
                                            data-brave-ignore-autofill="true"
                                            className={`w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-24 ${
                                                pickupVerified ? 'border-green-500 bg-green-50' : ''
                                            }`}
                                            required
                                        />
                                    </Autocomplete>
                                ) : (
                                    <input
                                        // fallback plain input while loading
                                        id="pu-loc"
                                        name="pu-loc-field"
                                        type="text"
                                        value={formData.pickupAddress}
                                        onChange={handleChange}
                                        placeholder="Loading autocomplete..."
                                        className="w-full border-2 border-gray-300 p-2 rounded-md"
                                        disabled
                                    />
                                )}
                                {pickupVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-700 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-300 shadow-sm">
                                        <span className="text-base leading-none">✓</span>
                                        <span>Verified</span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <label htmlFor="pickupContactName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Name
                                </label>
                                <input
                                    id="pickupContactName"
                                    name="pickupContactName"
                                    type="text"
                                    value={formData.pickupContactName}
                                    onChange={handleChange}
                                    placeholder="Name at pickup location"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="pickupContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Phone
                                </label>
                                <input
                                    id="pickupContactPhone"
                                    name="pickupContactPhone"
                                    type="tel"
                                    value={formData.pickupContactPhone}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="pickupInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                                    Pickup Instructions
                                </label>
                                <textarea
                                    id="pickupInstructions"
                                    name="pickupInstructions"
                                    value={formData.pickupInstructions}
                                    onChange={handleChange}
                                    placeholder="Any special instructions..."
                                    rows={3}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="totalPieces" className="block text-sm font-medium text-gray-700 mb-1">
                                    Total Pieces
                                </label>
                                <input
                                    id="totalPieces"
                                    name="totalPieces"
                                    type="number"
                                    value={formData.totalPieces}
                                    onChange={handleChange}
                                    placeholder="e.g., 5"
                                    min="1"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="orderWeight" className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Weight (lbs)
                                </label>
                                <input
                                    id="orderWeight"
                                    name="orderWeight"
                                    type="number"
                                    step="0.1"
                                    value={formData.orderWeight}
                                    onChange={handleChange}
                                    placeholder="e.g., 10.5"
                                    min="0.1"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        {pickupVerified && (
                            <div className="mt-2 text-sm">
                                <span className="font-medium text-green-700">Verified as:</span> {pickupVerified}
                                {pickupVerified !== formData.pickupAddress && (
                                    <span className="text-yellow-600 ml-2">(Google suggestion applied)</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Destination Pane */}
                    <div className="border border-gray-300 p-6 rounded-md">
                        <h2 className="text-2xl font-semibold mb-4">Destination Details</h2>

                        {/* Saved Recipients Dropdown */}
                        <div className="mb-6">
                            <label htmlFor="savedRecipient" className="block text-sm font-medium text-gray-700 mb-1">
                                Select Saved Recipient (optional)
                            </label>
                            <select
                                id="savedRecipient"
                                onChange={handleRecipientSelect}
                                className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                disabled={loadingRecipients}
                            >
                                <option value="0">
                                    {loadingRecipients ? 'Loading recipients...' : '— Select a saved recipient —'}
                                </option>
                                {recipients.map((recipient) => (
                                    <option key={recipient.id} value={recipient.id}>
                                        {recipient.name} - {recipient.address}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2 relative">
                                <label htmlFor="do-loc" className="block text-sm font-medium text-gray-700 mb-1">
                                    Dropoff Address
                                </label>
                                {isLoaded ? (
                                    <Autocomplete
                                        onLoad={(autocomplete) => {
                                            dropoffAutocompleteRef.current = autocomplete;
                                        }}
                                        onPlaceChanged={() => {
                                            const input = dropoffInputRef.current;
                                            if (input) {
                                                const place = dropoffAutocompleteRef.current?.getPlace();
                                                if (place?.formatted_address && place.geometry?.location) {
                                                    input.value = place.formatted_address; // direct DOM set
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        dropoffAddress: place.formatted_address!,  // ! tells TS it's definitely string
                                                    }));
                                                    setDropoffCoords({
                                                        lat: place.geometry.location.lat(),
                                                        lng: place.geometry.location.lng(),
                                                    });
                                                    setDropoffVerified(place.formatted_address);
                                                }
                                            }
                                        }}
                                        options={{
                                            types: ['address'],
                                            componentRestrictions: { country: 'us' },
                                        }}
                                    >
                                        <input
                                            id="do-loc"
                                            name="do-loc-field"
                                            ref={dropoffInputRef}
                                            type="text"
                                            defaultValue={formData.dropoffAddress}
                                            onChange={(e) => setFormData(prev => ({ ...prev, dropoffAddress: e.target.value }))}
                                            onBlur={(e) => setFormData(prev => ({ ...prev, dropoffAddress: e.target.value }))}
                                            placeholder="Start typing the dropoff location..."
                                            autoComplete="off new-password"
                                            autoCorrect="off"                     // macOS/iOS
                                            spellCheck="false"                    // extra layer
                                            data-brave-ignore-autofill="true"
                                            className={`w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500 pr-24 ${
                                                dropoffVerified ? 'border-green-500 bg-green-50' : ''
                                            }`}
                                            required
                                        />
                                    </Autocomplete>
                                ) : (
                                    <input
                                        id="do-loc"
                                        name="do-loc-field"
                                        type="text"
                                        value={formData.dropoffAddress}
                                        onChange={handleChange}
                                        placeholder="Loading autocomplete..."
                                        className="w-full border-2 border-gray-300 p-2 rounded-md"
                                        disabled
                                    />
                                )}
                                {dropoffVerified && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-green-700 text-xs font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-300 shadow-sm">
                                        <span className="text-base leading-none">✓</span>
                                        <span>Verified</span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <label htmlFor="dropoffContactName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Name
                                </label>
                                <input
                                    id="dropoffContactName"
                                    name="dropoffContactName"
                                    type="text"
                                    value={formData.dropoffContactName}
                                    onChange={handleChange}
                                    placeholder="Name at dropoff location"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="dropoffContactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Phone
                                </label>
                                <input
                                    id="dropoffContactPhone"
                                    name="dropoffContactPhone"
                                    type="tel"
                                    value={formData.dropoffContactPhone}
                                    onChange={handleChange}
                                    placeholder="Phone number"
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="dropoffInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                                    Delivery Instructions
                                </label>
                                <textarea
                                    id="dropoffInstructions"
                                    name="dropoffInstructions"
                                    value={formData.dropoffInstructions}
                                    onChange={handleChange}
                                    placeholder="Any special instructions..."
                                    rows={3}
                                    className="w-full border-2 border-gray-300 p-2 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                        </div>
                        {dropoffVerified && (
                            <div className="mt-2 text-sm">
                                <span className="font-medium text-green-700">Verified as:</span>{' '}
                                {dropoffVerified}
                                {dropoffVerified !== formData.dropoffAddress && (
                                    <span className="text-yellow-600 ml-2">(Google suggestion applied)</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Fixed Pricing Box */}
                    {pickupVerified && dropoffVerified && (
                        <div className="border border-green-300 p-6 rounded-md bg-green-50">
                            <h2 className="text-2xl font-semibold mb-4 text-green-800">Delivery Price</h2>
                            <p className="text-3xl font-bold text-green-700">${price.toFixed(2)}</p>
                            <p className="mt-2 text-gray-700">
                                {deliveryType} Delivery — Guaranteed by end of day
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                                (Fixed rate — no surge pricing)
                            </p>
                        </div>
                    )}

                    {/* Map Preview */}
                    {(pickupCoords || dropoffCoords) && (
                        <div className="border border-gray-300 p-6 rounded-md">
                            <h2 className="text-2xl font-semibold mb-4">Route Preview</h2>
                            {loadError && <p className="text-red-600 mb-2">Failed to load Google Maps: {loadError.message}</p>}
                            {mapError && <p className="text-red-600 mb-2">{mapError}</p>}
                            {!isLoaded && <p className="text-gray-500">Loading map...</p>}
                            {isLoaded && (
                                <GoogleMap
                                    mapContainerStyle={mapContainerStyle}
                                    center={pickupCoords || dropoffCoords || { lat: 33.4484, lng: -112.0740 }}
                                    zoom={pickupCoords && dropoffCoords ? 11 : 12}
                                >
                                    {pickupCoords && <Marker position={pickupCoords} label="Pickup" />}
                                    {dropoffCoords && <Marker position={dropoffCoords} label="Dropoff" />}
                                    {directions && <DirectionsRenderer directions={directions} />}
                                </GoogleMap>
                            )}
                        </div>
                    )}

                    {/* Save Recipient Checkbox */}
                    <div className="flex items-center space-x-2 my-6">
                        <input
                            type="checkbox"
                            id="saveRecipient"
                            checked={saveRecipient}
                            onChange={(e) => setSaveRecipient(e.target.checked)}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="saveRecipient" className="text-sm font-medium text-gray-700">
                            Save this recipient for future orders
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex space-x-4 justify-end">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-gray-300 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-400 transition"
                            disabled={isSubmitting}
                        >
                            Clear Form
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !pickupCoords || !dropoffCoords}
                            className={`bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50 ${
                                !pickupCoords || !dropoffCoords ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        >
                            {isSubmitting ? 'Scheduling...' : 'Schedule Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}