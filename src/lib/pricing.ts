// src/lib/pricing.ts
export function calculatePrice(
    service: '1hr' | '2hr' | '4hr' | 'routed',
    distanceMiles: number | null,
    requestHour: number,
    driveTimeMinutes: number | null = null
): number {
    const services = {
        '1hr': { min: 25, base: 15, rate: 1.15, hourly: 28 },
        '2hr': { min: 22, base: 13, rate: 1.05, hourly: 26 },
        '4hr': { min: 18, base: 10, rate: 0.95, hourly: 24 },
        'routed': { min: 10, base: 10, rate: 0, hourly: 0 }
    } as const;
    if (!services[service]) throw new Error('Invalid service');
    const config = services[service];

    let basePrice: number;
    if (driveTimeMinutes !== null) {
        const hours = driveTimeMinutes / 60;
        basePrice = config.base + config.hourly * hours;
    } else if (distanceMiles !== null) {
        basePrice = config.base + config.rate * distanceMiles;
    } else {
        basePrice = config.base;
    }
    let price = Math.max(config.min, basePrice);
    const surge = requestHour >= 15 && requestHour <= 19 ? 1.2 : 1.0;
    price *= surge;
    return parseFloat(price.toFixed(2));
}