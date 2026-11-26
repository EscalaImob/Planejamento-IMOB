import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents/partialPrefetching ficam desligados: o adaptador OpenNext para Cloudflare
  // ainda não os suporta (a página inicial travava no runtime do Workers). O projeto não os usa.
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
