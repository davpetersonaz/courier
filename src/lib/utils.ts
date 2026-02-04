// src/lib/utils.ts

export function formatPhone(phone: string | null): string {
    if (!phone) return '—';
    const digits = phone.replace(/\D/g, '');// Strip everything except digits
    // US 10-digit format
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    // Fallback: show as-is (could add 7-digit or +1 handling later)
    return phone;
}

