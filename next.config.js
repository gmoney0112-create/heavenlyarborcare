/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['remotionlambda-useast1-x71wsi1jws.s3.amazonaws.com'],
  },
    typescript: { ignoreBuildErrors: true },
}

module.exports = nextConfig
