// next.config.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        forceSwcTransforms: true     // Force use of bundled SWC
    },
    webpack: (config: any) => {
        const resolve = config.resolve ?? {};
        resolve.fallback = {
            ...resolve.fallback,
            fs: false,
        };
        config.resolve = resolve;
        return config;
    },
};

export default nextConfig;