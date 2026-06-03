import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  transpilePackages: [
    "@learnify/ai",
    "@learnify/core",
    "@learnify/database",
    "@learnify/design-tokens",
    "@learnify/shared",
  ],
}

export default nextConfig
