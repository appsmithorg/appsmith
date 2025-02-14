"use strict";

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const WorkboxWebpackPlugin = require("workbox-webpack-plugin");
const ModuleScopePlugin = require("react-dev-utils/ModuleScopePlugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const paths = require("./paths");
const modules = require("./modules");
const getClientEnvironment = require("./env");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");
const FaroSourceMapUploaderPlugin = require("@grafana/faro-webpack-plugin");

const createEnvironmentHash = require("./createEnvironmentHash");

// Handle airgap build path
const isAirgap = process.env.REACT_APP_AIRGAP_ENABLED === "true";
if (isAirgap) {
  paths.appBuild = path.resolve("build_airgap");
}

const reactRefreshRuntimeEntry = require.resolve("react-refresh/runtime");
const reactRefreshWebpackPluginRuntimeEntry = require.resolve(
  "@pmmmwh/react-refresh-webpack-plugin",
);
const babelRuntimeEntry = require.resolve("babel-preset-react-app");
const babelRuntimeEntryHelpers = require.resolve(
  "@babel/runtime/helpers/esm/assertThisInitialized",
  { paths: [babelRuntimeEntry] },
);
const babelRuntimeRegenerator = require.resolve("@babel/runtime/regenerator", {
  paths: [babelRuntimeEntry],
});

// Some apps do not need the benefits of saving a web request, so not inlining the chunk
// makes for a smoother build process.
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== "false";

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || "10000",
);

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig);

// Check if Tailwind config exists
const useTailwind = fs.existsSync(
  path.join(paths.appPath, "tailwind.config.js"),
);

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === "true") {
    return false;
  }

  try {
    require.resolve("react/jsx-runtime");
    return true;
  } catch (e) {
    return false;
  }
})();

// This is the production and development configuration.
// It is focused on developer experience, fast rebuilds, and a minimal bundle.
module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

  // Set devtool based on environment
  const devtool = isEnvProduction ? "source-map" : false;

  // Variable used for enabling profiling in Production
  // passed into alias object. Uses a flag if passed into the build command
  const isEnvProductionProfile =
    isEnvProduction && process.argv.includes("--profile");

  // We will provide `paths.publicUrlOrPath` to our app
  // as %PUBLIC_URL% in `index.html` and `process.env.PUBLIC_URL` in JavaScript.
  // Omit trailing slash as %PUBLIC_URL%/xyz looks better than %PUBLIC_URL%xyz.
  // Get environment variables to inject into our app.
  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const shouldUseReactRefresh = env.raw.FAST_REFRESH;

  // common function to get style loaders
  const getStyleLoaders = (cssOptions, preProcessor) => {
    const loaders = [
      isEnvDevelopment && require.resolve("style-loader"),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        // css is located in `static/css`, use '../../' to locate index.html folder
        // in production `paths.publicUrlOrPath` can be a relative path
        options: paths.publicUrlOrPath.startsWith(".")
          ? { publicPath: "../../" }
          : {},
      },
      {
        loader: require.resolve("css-loader"),
        options: cssOptions,
      },
      {
        // Options for PostCSS as we reference these options twice
        // Adds vendor prefixing based on your specified browser support in
        // package.json
        loader: require.resolve("postcss-loader"),
        options: {
          postcssOptions: {
            // Necessary for external CSS imports to work
            // https://github.com/facebook/create-react-app/issues/2677
            ident: "postcss",
            config: false,
            plugins: !useTailwind
              ? [
                  "postcss-flexbugs-fixes",
                  [
                    "postcss-preset-env",
                    {
                      autoprefixer: {
                        flexbox: "no-2009",
                      },
                      stage: 3,
                    },
                  ],
                  // Adds PostCSS Normalize as the reset css with default options,
                  // so that it honors browserslist config in package.json
                  // which in turn let's users customize the target behavior as per their needs.
                  "postcss-normalize",
                ]
              : [
                  "tailwindcss",
                  "postcss-flexbugs-fixes",
                  [
                    "postcss-preset-env",
                    {
                      autoprefixer: {
                        flexbox: "no-2009",
                      },
                      stage: 3,
                    },
                  ],
                ],
          },
          sourceMap: isEnvProduction ? true : isEnvDevelopment,
        },
      },
    ].filter(Boolean);
    if (preProcessor) {
      loaders.push(
        {
          loader: require.resolve("resolve-url-loader"),
          options: {
            sourceMap: isEnvProduction ? true : isEnvDevelopment,
            root: paths.appSrc,
          },
        },
        {
          loader: require.resolve(preProcessor),
          options: {
            sourceMap: true,
          },
        },
      );
    }
    return loaders;
  };

  return {
    target: ["browserslist"],
    // Webpack noise constrained to errors and warnings
    stats: "errors-warnings",
    mode: isEnvProduction ? "production" : "development",
    // Stop compilation early in production
    bail: isEnvProduction,
    devtool: devtool,
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: paths.appIndexJs,
    output: {
      // If airgap is enabled, change the build path
      path: isAirgap ? path.resolve("build_airgap") : paths.appBuild,
      // Add /* filename */ comments to generated require()s in the output.
      pathinfo: isEnvDevelopment,
      // There will be one main bundle, and one file per asynchronous chunk.
      // In development, it does not produce real files.
      filename: isEnvProduction
        ? "static/js/[name].[contenthash:8].js"
        : isEnvDevelopment && "static/js/bundle.js",
      // There are also additional JS chunk files if you use code splitting.
      chunkFilename: isEnvProduction
        ? "static/js/[name].[contenthash:8].chunk.js"
        : isEnvDevelopment && "static/js/[name].chunk.js",
      assetModuleFilename: "static/media/[name].[hash][ext]",
      // webpack uses `publicPath` to determine where the app is being served from.
      // It requires a trailing slash, or the file assets will get an incorrect path.
      // We inferred the "public path" (such as / or /my-project) from homepage.
      publicPath: paths.publicUrlOrPath,
      // Point sourcemap entries to original disk location (format as URL on Windows)
      devtoolModuleFilenameTemplate: isEnvProduction
        ? (info) =>
            path
              .relative(paths.appSrc, info.absoluteResourcePath)
              .replace(/\\/g, "/")
        : isEnvDevelopment &&
          ((info) =>
            path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")),
    },
    cache: {
      type: "filesystem",
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: "pack",
      buildDependencies: {
        defaultWebpack: ["webpack/lib/"],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter((f) =>
          fs.existsSync(f),
        ),
      },
    },
    infrastructureLogging: {
      level: "none",
    },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // This is only used in production mode
        new TerserPlugin({
          terserOptions: {
            parse: {
              // We want terser to parse ecma 8 code. However, we don't want it
              // to apply any minification steps that turns valid ecma 5 code
              // into invalid ecma 5 code. This is why the 'compress' and 'output'
              // sections only apply transformations that are ecma 5 safe
              // https://github.com/facebook/create-react-app/pull/4234
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              // Disabled because of an issue with Uglify breaking seemingly valid code:
              // https://github.com/facebook/create-react-app/issues/2376
              // Pending further investigation:
              // https://github.com/mishoo/UglifyJS2/issues/2011
              comparisons: false,
              // Disabled because of an issue with Terser breaking valid code:
              // https://github.com/facebook/create-react-app/issues/5250
              // Pending further investigation:
              // https://github.com/terser-js/terser/issues/120
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            // Added for profiling in devtools
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              // Turned on because emoji and regex is not minified properly using default
              // https://github.com/facebook/create-react-app/issues/2488
              ascii_only: true,
            },
          },
        }),
        // This is only used in production mode
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        cacheGroups: {
          icons: {
            // This determines which modules are considered icons
            test: (module) => {
              const modulePath = module.resource;
              if (!modulePath) return false;

              return (
                modulePath.match(/node_modules[\\\/]remixicon-react[\\\/]/) ||
                modulePath.endsWith(".svg.js") ||
                modulePath.endsWith(".svg")
              );
            },
            // This determines which chunk to put the icon into.
            //
            // Why have three separate cache groups for three different kinds of
            // icons? Purely as an optimization: not every page needs all icons,
            // so we can avoid loading unused icons sometimes.
            name: (module) => {
              if (
                module.resource?.match(
                  /node_modules[\\\/]remixicon-react[\\\/]/,
                )
              ) {
                return "remix-icons";
              }

              if (module.resource?.includes("blueprint")) {
                return "blueprint-icons";
              }

              return "svg-icons";
            },
            // This specifies that only icons from import()ed chunks should be moved
            chunks: "async",
            // This makes webpack ignore the minimum chunk size requirement
            enforce: true,
          },
        },
      },
    },
    resolve: {
      // This allows you to set a fallback for where webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebook/create-react-app/issues/253
      modules: [paths.appSrc, "node_modules", paths.appNodeModules].concat(
        modules.additionalModulePaths || [],
      ),
      // These are the reasonable defaults supported by the Node ecosystem.
      // We also include JSX as a common component filename extension to support
      // some tools, although we do not recommend using it, see:
      // https://github.com/facebook/create-react-app/issues/290
      // `web` extension prefixes have been added for better support
      // for React Native Web.
      extensions: paths.moduleFileExtensions
        .map((ext) => `.${ext}`)
        .filter((ext) => useTypeScript || !ext.includes("ts")),
      extensionAlias: { ".js": [".js", ".ts", ".tsx", ".jsx"] },
      fullySpecified: false,
      alias: {
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        "react-native": "react-native-web",
        "lodash-es": "lodash",
        // Allows for better profiling with ReactDevTools
        ...(isEnvProductionProfile && {
          "react-dom$": "react-dom/profiling",
          "scheduler/tracing": "scheduler/tracing-profiling",
        }),
        ...(modules.webpackAliases || {}),
      },
      fallback: {
        assert: false,
        stream: false,
        util: false,
        fs: false,
        os: false,
        path: false,
        "react/jsx-runtime": require.resolve("react/jsx-runtime"),
      },
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(
          [paths.appSrc, path.resolve(paths.appPath, "packages")],
          [
            paths.appPackageJson,
            reactRefreshRuntimeEntry,
            reactRefreshWebpackPluginRuntimeEntry,
            babelRuntimeEntry,
            babelRuntimeEntryHelpers,
            babelRuntimeRegenerator,
          ],
        ),
      ],
    },
    module: {
      strictExportPresence: true,
      rules: [
        // Handle node_modules packages that contain sourcemaps
        {
          enforce: "pre",
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          loader: require.resolve("source-map-loader"),
        },
        {
          // "oneOf" will traverse all following loaders until one will
          // match the requirements. When no loader matches it will fall
          // back to the "file" loader at the end of the loader list.
          oneOf: [
            // TODO: Merge this config once `image/avif` is in the mime-db
            // https://github.com/jshttp/mime-db
            {
              test: [/\.avif$/],
              type: "asset",
              mimetype: "image/avif",
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            // "url" loader works like "file" loader except that it embeds assets
            // smaller than specified limit in bytes as data URLs to avoid requests.
            // A missing `test` is equivalent to a match.
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: "asset",
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            {
              test: /\.svg$/,
              use: [
                {
                  loader: require.resolve("@svgr/webpack"),
                  options: {
                    prettier: false,
                    svgo: false,
                    svgoConfig: {
                      plugins: [{ removeViewBox: false }],
                    },
                    titleProp: true,
                    ref: true,
                  },
                },
                {
                  loader: require.resolve("file-loader"),
                  options: {
                    name: "static/media/[name].[hash].[ext]",
                  },
                },
              ],
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: [path.resolve("packages"), paths.appSrc],
              loader: require.resolve("babel-loader"),
              options: {
                customize: require.resolve(
                  "babel-preset-react-app/webpack-overrides",
                ),
                presets: [
                  [
                    require.resolve("babel-preset-react-app"),
                    {
                      runtime: hasJsxRuntime ? "automatic" : "classic",
                    },
                  ],
                ],
                plugins: [
                  isEnvDevelopment &&
                    shouldUseReactRefresh &&
                    require.resolve("react-refresh/babel"),
                ].filter(Boolean),
                cacheDirectory: true,
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            // Process any JS outside of the app with Babel.
            // Unlike the application JS, we only compile the standard ES features.
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [
                  [
                    require.resolve("babel-preset-react-app/dependencies"),
                    { helpers: true },
                  ],
                ],
                cacheDirectory: true,
                // See #6846 for context on why cacheCompression is disabled
                cacheCompression: false,

                // Babel sourcemaps are needed for debugging into node_modules
                // code.  Without the options below, debuggers like VSCode
                // show incorrect code and set breakpoints on the wrong lines.
                sourceMaps: true,
                inputSourceMap: true,
              },
            },
            // "postcss" loader applies autoprefixer to our CSS.
            // "css" loader resolves paths in CSS and adds assets as dependencies.
            // "style" loader turns CSS into JS modules that inject <style> tags.
            // In production, we use MiniCSSExtractPlugin to extract that CSS
            // to a file, but in development "style" loader enables hot editing
            // of CSS.
            // By default we support CSS Modules with the extension .module.css
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction ? true : isEnvDevelopment,
                modules: {
                  mode: "icss",
                },
              }),
              // Don't consider CSS imports dead code even if the
              // containing package claims to have no side effects.
              // Remove this when webpack adds a warning or an error for this.
              // See https://github.com/webpack/webpack/issues/6571
              sideEffects: true,
            },
            // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
            // using the extension .module.css
            {
              test: cssModuleRegex,
              use: [
                ...getStyleLoaders({
                  importLoaders: 1,
                  sourceMap: isEnvProduction ? true : isEnvDevelopment,
                  modules: {
                    mode: "local",
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                }),
                {
                  loader: "postcss-loader",
                  options: {
                    postcssOptions: {
                      plugins: [
                        "postcss-nesting",
                        "postcss-import",
                        "postcss-at-rules-variables",
                        "postcss-each",
                        "postcss-url",
                        "postcss-modules-values",
                        [
                          "cssnano",
                          {
                            preset: ["default"],
                          },
                        ],
                      ],
                    },
                  },
                },
              ],
            },
            // "file" loader makes sure those assets get served by WebpackDevServer.
            // When you `import` an asset, you get its (virtual) filename.
            // In production, they would get copied to the `build` folder.
            // This loader doesn't use a "test" so it will catch all modules
            // that fall through the other loaders.
            {
              // Exclude `js` files to keep "css" loader working as it injects
              // its runtime that would otherwise be processed through "file" loader.
              // Also exclude `html` and `json` extensions so they get processed
              // by webpacks internal loaders.
              exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: "asset/resource",
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
          ],
        },
      ].filter(Boolean),
    },
    ignoreWarnings: [
      function ignoreSourcemapsloaderWarnings(warning) {
        return (
          (warning.module?.resource.includes("node_modules") &&
            warning.details?.includes("source-map-loader")) ??
          false
        );
      },
      function ignorePackageWarnings(warning) {
        return (
          warning.module?.resource.includes(
            "/node_modules/@babel/standalone/babel.js",
          ) ||
          warning.module?.resource.includes("/node_modules/sass/sass.dart.js")
        );
      },
    ],
    plugins: [
      // Replace BlueprintJS’s icon component with our own implementation
      // that code-splits icons away
      new webpack.NormalModuleReplacementPlugin(
        /@blueprintjs\/core\/lib\/\w+\/components\/icon\/icon\.\w+/,
        require.resolve(
          `${paths.appSrc}/components/designSystems/blueprintjs/icon/index.js`,
        ),
      ),
      isEnvProduction &&
        new RetryChunkLoadPlugin({
          retryDelay: 3000,
          maxRetries: 2,
          lastResortScript: "window.location.href='/404.html';",
        }),
      isEnvProduction &&
        new CompressionPlugin({
          algorithm: "brotliCompress",
          filename: "[path][base].br",
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        }),
      isEnvProduction &&
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
      // Generates an `index.html` file with the <script> injected.
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: paths.appHtml,
          },
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
              }
            : undefined,
        ),
      ),
      // Inlines the webpack runtime script. This script is too small to warrant
      // a network request.
      // https://github.com/facebook/create-react-app/issues/5358
      isEnvProduction &&
        shouldInlineRuntimeChunk &&
        new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      // Makes some environment variables available in index.html.
      // The public URL is available as %PUBLIC_URL% in index.html, e.g.:
      // <link rel="icon" href="%PUBLIC_URL%/favicon.ico">
      // It will be an empty string unless you specify "homepage"
      // in `package.json`, in which case it will be the pathname of that URL.
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      // This gives some necessary context to module not found errors, such as
      // the requesting resource.
      new ModuleNotFoundPlugin(paths.appPath),
      // Makes some environment variables available to the JS code, for example:
      // if (process.env.NODE_ENV === 'production') { ... }. See `./env.js`.
      // It is absolutely essential that NODE_ENV is set to production
      // during a production build.
      // Otherwise React will be compiled in the very slow development mode.
      new webpack.DefinePlugin(env.stringified),
      // Experimental hot reloading for React .
      // https://github.com/facebook/react/tree/main/packages/react-refresh
      isEnvDevelopment &&
        shouldUseReactRefresh &&
        new ReactRefreshWebpackPlugin({
          overlay: false,
        }),
      // Watcher doesn't work well if you mistype casing in a path so we use
      // a plugin that prints an error when you attempt to do this.
      // See https://github.com/facebook/create-react-app/issues/240
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvProduction &&
        new MiniCssExtractPlugin({
          // Options similar to the same options in webpackOptions.output
          // both options are optional
          filename: "static/css/[name].[contenthash:8].css",
          chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
        }),
      // Generate an asset manifest file with the following content:
      // - "files" key: Mapping of all asset filenames to their corresponding
      //   output file so that tools can pick it up without having to parse
      //   `index.html`
      // - "entrypoints" key: Array of files which are included in `index.html`,
      //   can be used to reconstruct the HTML if necessary
      new WebpackManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            (fileName) => !fileName.endsWith(".map"),
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      // Moment.js is an extremely popular library that bundles large locale files
      // by default due to how webpack interprets its code. This is a practical
      // solution that requires the user to opt into importing specific locales.
      // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
      // You can remove this if you don't use Moment.js:
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/locale$/,
        contextRegExp: /moment$/,
      }),
      isEnvProduction &&
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: "./src/serviceWorker.ts",
          mode: "development",
          swDest: "./pageService.js",
          maximumFileSizeToCacheInBytes: 11 * 1024 * 1024,
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
          ],
          // Don’t cache-bust JS and CSS chunks
          dontCacheBustURLsMatching: /\.[0-9a-zA-Z]{8}\.chunk\.(js|css)$/,
        }),
      isEnvDevelopment &&
        new WorkboxWebpackPlugin.InjectManifest({
          swSrc: "./src/serviceWorker.ts",
          mode: "development",
          swDest: "./pageService.js",
          exclude: [
            // Don't cache source maps and PWA manifests.
            // (These are the default values of the `exclude` option: https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-WebpackPartial,
            // so we need to specify them explicitly if we're extending this array.)
            /\.map$/,
            /^manifest.*\.js$/,
            // Don't cache the root html file
            /index\.html/,
            // Don't cache LICENSE.txt files emitted by CRA
            // when a chunk includes some license comments
            /LICENSE\.txt/,
            // Don't cache static icons as there are hundreds of them, and caching them all
            // one by one (as the service worker does it) keeps the network busy for a long time
            // and delays the service worker installation
            /\/*\.svg$/,
            /\.(js|css|html|png|jpg|jpeg|gif)$/, // Exclude JS, CSS, HTML, and image files
          ],
        }),
    ].filter(Boolean),
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false,
  };
};
