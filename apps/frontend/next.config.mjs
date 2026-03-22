/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    compress: true,
    poweredByHeader: false,
    productionBrowserSourceMaps: false,
    optimizeFonts: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.ytimg.com",
                pathname: "/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/:path*",
                headers: [
                    { key: "X-DNS-Prefetch-Control", value: "on" },
                    { key: "X-Frame-Options", value: "SAMEORIGIN" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                    {
                        key: "Permissions-Policy",
                        value: "camera=(), microphone=(), geolocation=()",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
