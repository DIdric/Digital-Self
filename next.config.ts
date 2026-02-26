import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            // Allow vibecutery.com to embed this site in an iframe.
            // frame-ancestors replaces X-Frame-Options in modern browsers.
            // Omitting X-Frame-Options lets CSP take full control.
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://vibecutery.com https://*.vibecutery.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
