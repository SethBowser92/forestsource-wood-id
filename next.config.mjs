/** @type {import('next').NextConfig} */
const nextConfig = { productionBrowserSourceMaps: true }

// Optional Sentry integration
const withSentry = (config) => {
  try {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { withSentryConfig } = require('@sentry/nextjs')
    return withSentryConfig(config, { silent: true })
  } catch (_) {
    return config
  }
}

export default withSentry(nextConfig)
