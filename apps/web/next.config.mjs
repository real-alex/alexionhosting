/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // @alexion/shared ships compiled JS, but transpiling keeps types/HMR smooth.
  transpilePackages: ['@alexion/shared'],
  // ESLint is wired separately; don't block production builds on it yet.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
