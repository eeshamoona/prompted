import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off: every screen is personal to the signed-in user.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
