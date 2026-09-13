import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@tirajeh/ui", "@tirajeh/shared", "@tirajeh/auth"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.liara.space",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "tirajeconcrete.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
  serverExternalPackages: ["@napi-rs/canvas"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("@napi-rs/canvas");
    }
    config.module.rules.push({
      test: /\.node$/,
      use: "node-loader",
    });
    return config;
  },
}

export default withNextIntl(nextConfig)
