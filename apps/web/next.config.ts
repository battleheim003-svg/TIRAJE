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
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"],
    },
  },
}

export default withNextIntl(nextConfig)
