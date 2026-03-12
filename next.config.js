/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-pdf/renderer"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@react-pdf/renderer$"] = path.join(
        __dirname,
        "node_modules/@react-pdf/renderer/lib/react-pdf.browser.js"
      );
    }
    return config;
  },
};

module.exports = nextConfig;
