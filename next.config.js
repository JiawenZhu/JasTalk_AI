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

  // Experimental features for performance (removed deprecated options)
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },

  // Webpack optimizations
  webpack: (webpackConfig, { dev, isServer, webpack }) => {
    // Performance optimizations
    if (!dev && !isServer) {
      // Code splitting optimizations
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendors',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
            // Common chunk
            common: {
              name: 'commons',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            // Framer Motion chunk (since it's used heavily)
            framerMotion: {
              name: 'framer-motion',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              priority: 30,
            },
            // UI components chunk
            ui: {
              name: 'ui',
              chunks: 'all',
              test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
              priority: 25,
            },
          },
        },
      };

      // Bundle analyzer (only in development)
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
    }

    // Remove node: from import specifiers
    webpackConfig.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );

    // Optimize imports
    webpackConfig.resolve.alias = {
      ...webpackConfig.resolve.alias,
      // Add aliases for commonly used paths
    };

    return webpackConfig;
  },

  // Environment variables
  env: {
    CUSTOM_KEY: 'performance_optimized',
  },

  // TypeScript configuration
  typescript: {
    // Ignore TypeScript errors during build for faster builds
    // Only enable this if you're confident in your TypeScript setup
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Ignore ESLint errors during build for faster builds
    // Only enable this if you're confident in your ESLint setup
    ignoreDuringBuilds: true,
  },

  // Output optimization
  output: 'standalone',
  
  // Swc minification (faster than Terser)
  swcMinify: true,
};

module.exports = nextConfig;
