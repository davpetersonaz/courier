// src/lib/user-role.ts
export const UserRole = {
    CUSTOMER: 'CUSTOMER',
    COURIER: 'COURIER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];