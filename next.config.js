/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Add any remote image domains here if needed
    ],
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Performance headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects - removed root redirect to let client handle authentication
  async redirects() {
    return [
      // Add any other redirects here if needed
    ];
  },

  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@heroicons/react', 'framer-motion'],
  },

  // Simple webpack configuration
  webpack: (config, { dev, isServer, webpack }) => {
    // Basic optimizations
    if (!dev && !isServer) {
      // Production optimizations
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              name: 'vendors',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
          },
        },
      };
    }

    // Cache optimization
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
      cacheDirectory: require('path').resolve(__dirname, '.next/cache'),
      compression: 'gzip',
      maxAge: 172800000, // 2 days
    };

    return config;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'performance_optimized',
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Output optimization
  output: 'standalone',
  
  // Swc minification (faster than Terser)
  swcMinify: true,
};

module.exports = nextConfig;
