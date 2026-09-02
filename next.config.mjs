/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://*.altcha.org",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://i.ibb.co https://images.unsplash.com https://images.pexels.com https://via.placeholder.com https://*.googleusercontent.com https://*.tinify.com https://payment.bkash.com https://scripts.bkash.com",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://api.tinify.com https://api.imgbb.com https://token.sandbox.bka.sh https://checkout.sandbox.bka.sh https://token.pay.bka.sh https://checkout.pay.bka.sh https://payment.bkash.com https://*.steadfast.com.bd https://*.altcha.org",
      "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com https://*.bkash.com https://payment.bkash.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' https://payment.bkash.com https://scripts.bkash.com",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      }
    ],
  },
};

export default nextConfig;
