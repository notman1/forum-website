/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['enkdkykzecvwqwtkjlsx.supabase.co'], // Add your Supabase domain for images
    unoptimized: true, // For static export compatibility
  },
}

module.exports = nextConfig