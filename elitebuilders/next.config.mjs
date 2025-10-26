/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable caching for all routes in development
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
    turbopack: {
      // Set the project root to silence multiple lockfiles warning
      root: process.cwd(),
    },
  },
}

export default nextConfig
