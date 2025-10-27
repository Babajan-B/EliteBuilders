/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // AGGRESSIVE CACHE BUSTING FOR DEVELOPMENT
  experimental: {
    // Disable all caching in development
    staleTimes: {
      dynamic: 0,
      static: 0,
    },
  },
  // Add cache-control headers to prevent browser caching in development
  async headers() {
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          // Apply to all routes
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
            },
            {
              key: 'Pragma',
              value: 'no-cache',
            },
            {
              key: 'Expires',
              value: '0',
            },
          ],
        },
      ];
    }
    return [];
  },
  // Disable webpack/turbopack caching in development
  onDemandEntries: {
    maxInactiveAge: 0,
    pagesBufferLength: 0,
  },
}

export default nextConfig
