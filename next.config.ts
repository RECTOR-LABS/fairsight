import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.arweave.net' },
      { protocol: 'https', hostname: 'arweave.net' },
      { protocol: 'https', hostname: 'raw.githubusercontent.com' },
      { protocol: 'https', hostname: '*.ipfs.nftstorage.link' },
    ],
  },
};

export default nextConfig;
