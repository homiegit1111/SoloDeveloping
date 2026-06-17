/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse loads internal test files during Next.js static analysis — keep
  // it fully external so it is never bundled or statically analysed.
  // In Next.js 14 the correct key is experimental.serverComponentsExternalPackages
  experimental: {
    serverComponentsExternalPackages: ["pdf-parse"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pdf-parse");
    }
    return config;
  },
};

module.exports = nextConfig;
