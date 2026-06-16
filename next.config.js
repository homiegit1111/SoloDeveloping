/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // pdf-parse is server-only; keep it external so it isn't bundled for the client
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("pdf-parse");
    }
    return config;
  },
};

module.exports = nextConfig;
