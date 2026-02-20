'use client';
import { useRouter } from 'next/navigation';

interface CustomerFilterDropdownProps {
    customers: Array<{
        id: number;
        firstName: string;
        lastName: string | null;
        email: string;
    }>;
    currentCustomerId?: string;
}

export function CustomerFilterDropdown({ customers, currentCustomerId }: CustomerFilterDropdownProps) {
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const url = new URL(window.location.href);
        if (e.target.value) {
            url.searchParams.set('customerId', e.target.value);
        } else {
            url.searchParams.delete('customerId');
        }
        router.push(url.toString()); // smoother than window.location.href
    };

    return (
        <div className="w-full sm:w-100 pb-1.5">
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1.5">
                Filter by Client
            </label>
            <div className="relative">
                <select
                    id="customer"
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 text-sm shadow-sm
                            focus:border-blue-500 focus:ring2 focus:ring-blue-500/30 focus:outline-none transition-all duration-150 cursor-pointer"
                    defaultValue={currentCustomerId || ''}
                    onChange={handleChange}
                >
                    <option value="">All Clients</option>
                    {customers.map((cust) => (
                        <option key={cust.id} value={cust.id}>
                            {cust.firstName} {cust.lastName || ''} ({cust.email})
                        </option>
                    ))}
                </select>

                {/* Custom dropdown arrow */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" clipRule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.04 1.08l-4.25 4.25a.75.75 0 01-1.04 0L5.21 8.29a.75.75 0 01.02-1.06z"
                        />
                    </svg>
                </div>
            </div>
        </div>
    );
}