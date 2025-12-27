/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_ADMIN_API_BASE: process.env.BASE_URL
      ? `${process.env.BASE_URL}/api/admin`
      : undefined,
    NEXT_PUBLIC_BASE_URL: process.env.BASE_URL,
  },
  images: (() => {
    try {
      const u = process.env.BASE_URL ? new URL(process.env.BASE_URL) : null;
      if (!u) return {};
      return {
        remotePatterns: [
          {
            protocol: u.protocol.replace(":", ""),
            hostname: u.hostname,
            port: u.port || "",
            pathname: "/**",
          },
        ],
      };
    } catch {
      return {};
    }
  })(),
};

export default nextConfig;
