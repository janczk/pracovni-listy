/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@react-pdf/renderer"],
  // V developmentu vypnout webpack cache – předchází chybě "Cannot find module './XXX.js'"
  webpack: (config, { isServer, dev }) => {
    if (dev) {
      config.cache = false;
    }
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
