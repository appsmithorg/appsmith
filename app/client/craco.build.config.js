/* eslint-disable @typescript-eslint/no-var-requires */
const { merge } = require("webpack-merge");
const common = require("./craco.common.config.js");
const WorkboxPlugin = require("workbox-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");
const FaroSourceMapUploaderPlugin = require("@grafana/faro-webpack-plugin");
const path = require("path");

const env = process.env.REACT_APP_ENVIRONMENT;
const isAirgap = process.env.REACT_APP_AIRGAP_ENABLED;
const plugins = [];

plugins.push(
  new WorkboxPlugin.InjectManifest({
    swSrc: "./src/serviceWorker.ts",
    mode: "production",
    swDest: "./pageService.js",
    exclude: [
      // Don’t cache source maps and PWA manifests.
      // (These are the default values of the `exclude` option: https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-WebpackPartial,
      // so we need to specify them explicitly if we’re extending this array.)
      /\.map$/,
      /^manifest.*\.js$/,
      // Don’t cache the root html file
      /index\.html/,
      // Don’t cache LICENSE.txt files emitted by CRA
      // when a chunk includes some license comments
      /LICENSE\.txt/,
      // Don’t cache static icons as there are hundreds of them, and caching them all
      // one by one (as the service worker does it) keeps the network busy for a long time
      // and delays the service worker installation
      /\/*\.svg$/,
      /\.(js|css|html|png|jpg|jpeg|gif)$/, // Exclude JS, CSS, HTML, and image files
    ],
  }),
);

if (env === "PRODUCTION") {
  plugins.push(
    new FaroSourceMapUploaderPlugin({
      appId: process.env.REACT_APP_FARO_APP_ID,
      appName: process.env.REACT_APP_FARO_APP_NAME,
      endpoint: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_ENDPOINT,
      stackId: process.env.REACT_APP_FARO_STACK_ID,
      // instructions on how to obtain your API key are in the documentation
      // https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/sourcemap-upload-plugins/#obtain-an-api-key
      apiKey: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_API_KEY,
      gzipContents: true,
    }),
  );
}

plugins.push(
  new CompressionPlugin({
    algorithm: "brotliCompress",
    filename: "[path][base].br",
    test: /\.(js|css|html|svg)$/,
    threshold: 10240,
    minRatio: 0.8,
  }),
);

plugins.push(
  new RetryChunkLoadPlugin({
    // optional value to set the amount of time in milliseconds before trying to load the chunk again. Default is 0
    retryDelay: 3000,
    // optional value to set the maximum number of retries to load the chunk. Default is 1
    maxRetries: 2,
    // optional code to be executed in the browser context if after all retries chunk is not loaded.
    // if not set - nothing will happen and error will be returned to the chunk loader.
    lastResortScript: "window.location.href='/404.html';",
  }),
);

module.exports = merge(common, {
  babel: {
    plugins: ["babel-plugin-lodash"],
    loaderOptions: {
      cacheDirectory: false,
    },
  },
  webpack: {
    configure: {
      devtool: env === "PRODUCTION" ? "source-map" : false,
      plugins,
    },
  },
  plugins: [
    // Enable Airgap builds
    {
      plugin: {
        overrideWebpackConfig: ({ context: { env, paths }, webpackConfig }) => {
          if (env.REACT_APP_AIRGAP_ENABLED === "true" || isAirgap === "true") {
            paths.appBuild = webpackConfig.output.path =
              path.resolve("build_airgap");
          }
          return webpackConfig;
        },
      },
    },
  ],
});
