/* eslint-disable @typescript-eslint/no-var-requires */
const SentryWebpackPlugin = require('@sentry/webpack-plugin');
const merge = require('webpack-merge');
const common = require('./craco.common.config.js');

module.exports = merge(common, {
  webpack: {
    plugins: [
      new SentryWebpackPlugin({
        include: 'build',
        ignore: ['node_modules', 'webpack.config.js'],
        release: process.env.REACT_APP_SENTRY_RELEASE
      })
    ]
  },
});
