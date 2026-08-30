import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "Content-Security-Policy", value: "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self' https://github.com https://api.supabase.com https://vercel.com; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co; upgrade-insecure-requests" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ] }];
  },
  async redirects() {
    return [
      { source: "/docs", destination: "/doc", permanent: true },
      { source: "/documentation", destination: "/doc", permanent: true },
      { source: "/EULA", destination: "/eula", permanent: true },
      { source: "/Privacy", destination: "/privacy", permanent: true },
      { source: "/Support", destination: "/support", permanent: true },
      { source: "/help", destination: "/support", permanent: true },
    ];
  },
};

export default nextConfig;
