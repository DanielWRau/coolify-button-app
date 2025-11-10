/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for smaller Docker images
  experimental: {
    instrumentationHook: true, // Enable instrumentation for cron scheduler
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // CORS headers now handled by middleware.ts for dynamic origin support
}

export default nextConfig
