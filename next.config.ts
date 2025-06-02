import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh", // UploadThing subdomínios dinâmicos
        port: "",
        pathname: "/f/**",
      },
      {
        protocol: "https",
        hostname: "utfs.io", // UploadThing principal
        port: "",
        pathname: "/f/**",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com", // UploadThing alternativo
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.uploadthing.com", // Subdomínios do UploadThing
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
