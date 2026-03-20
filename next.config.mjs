/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // msedge-tts uses ws with native bufferutil — keep it as external so
  // webpack doesn't try to bundle the native addon.
  experimental: {
    serverComponentsExternalPackages: ["msedge-tts"],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable persistent webpack cache in dev.
      // This avoids recurring filesystem cache corruption (ENOENT .pack.gz,
      // missing vendor-chunks, stale compiled modules) at the cost of slower cold starts.
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
