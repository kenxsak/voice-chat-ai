import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: process.env.NODE_ENV === 'development' 
      ? [
          'http://localhost:5000',
          ...(process.env.REPLIT_DOMAINS ? [`https://${process.env.REPLIT_DOMAINS}`, `http://${process.env.REPLIT_DOMAINS}`] : []),
        ] 
      : undefined,
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  
  // External packages that should not be bundled (moved from experimental in Next.js 15)
  serverExternalPackages: ['pdf-parse'],
  // Ignore webpack warnings for known issues
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ignore Handlebars warnings
      config.ignoreWarnings = config.ignoreWarnings || [];
      config.ignoreWarnings.push(
        /Critical dependency: the request of a dependency is an expression/,
        /require.extensions is not supported by webpack/,
        /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/
      );
    }
    
    // Handle pdf-parse on the server side
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('canvas', 'jsdom');
    }
    
    return config;
  },
};

export default nextConfig;