/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Vercel deployment
  output: 'standalone',

  typescript: {
    // Only ignore build errors in development
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  images: {
    unoptimized: true,
  },
}

export default nextConfig
