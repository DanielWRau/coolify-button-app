/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Enable standalone output for smaller Docker images
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // CORS headers now handled by middleware.ts for dynamic origin support
  // instrumentation.ts is used by default in Next.js 15+ without experimental flag
}

export default nextConfig
