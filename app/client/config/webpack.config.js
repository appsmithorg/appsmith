"use strict";

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const resolve = require("resolve");
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
const ESLintPlugin = require("eslint-webpack-plugin");
const paths = require(path.resolve(__dirname, "./paths"));
const modules = require(path.resolve(__dirname, "./modules"));
const getClientEnvironment = require(path.resolve(__dirname, "./env"));
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");
const ForkTsCheckerWebpackPlugin =
  process.env.TSC_COMPILE_ON_ERROR === "true"
    ? require("react-dev-utils/ForkTsCheckerWarningWebpackPlugin")
    : require("react-dev-utils/ForkTsCheckerWebpackPlugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const { RetryChunkLoadPlugin } = require("webpack-retry-chunk-load-plugin");
const FaroSourceMapUploaderPlugin = require("@grafana/faro-webpack-plugin");

const createEnvironmentHash = require(
  path.resolve(__dirname, "./webpack/persistentCache/createEnvironmentHash"),
);

// Source maps are resource heavy and can cause out of memory issue for large source files.
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== "false";

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

const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === "true";
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === "true";

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || "10000",
);

// Check if TypeScript is setup
const useTypeScript = fs.existsSync(paths.appTsConfig);

// Check if Tailwind config exists
const useTailwind = fs.existsSync(
  path.join(paths.appPath, "tailwind.config.js"),
);

// Get the path to the uncompiled service worker (if it exists).
const swSrc = paths.swSrc;

// style files regexes
const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

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
        options: {
          ...cssOptions,
          modules: {
            ...cssOptions.modules,
            exportLocalsConvention: "camelCase",
          },
          import: true,
          importLoaders: 1,
          url: true,
          import: {
            filter: (url) => !url.startsWith("~"),
          },
        },
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
            config: true,
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
      preProcessor && {
        loader: require.resolve("resolve-url-loader"),
        options: {
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
          root: paths.appSrc,
        },
      },
      preProcessor && {
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: true,
        },
      },
    ].filter(Boolean);
    return loaders;
  };

  const appEnvironment = process.env.REACT_APP_ENVIRONMENT;
  const isAirgap = process.env.REACT_APP_AIRGAP_ENABLED;

  return {
    target: ["browserslist"],
    // Webpack noise constrained to errors and warnings
    stats: {
      children: true,
      errorDetails: true,
      warningsFilter: [
        // Ignore warnings about dynamic requires in sass.dart.js
        /sass\.dart\.js/,
        // Ignore warnings from @babel/standalone
        /@babel\/standalone/,
        // Ignore warnings about critical dependencies
        /Critical dependency/,
      ],
    },
    mode: isEnvProduction ? "production" : isEnvDevelopment && "development",
    // Stop compilation early in production
    bail: isEnvProduction,
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? "source-map"
        : false
      : isEnvDevelopment && "cheap-module-source-map",
    // These are the "entry points" to our application.
    // This means they will be the "root" imports that are included in JS bundle.
    entry: paths.appIndexJs,
    output: {
      // The build folder.
      path: paths.appBuild,
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
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
        new CssMinimizerPlugin({
          minify: CssMinimizerPlugin.cssnanoMinify,
          minimizerOptions: {
            preset: [
              "default",
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: false,
                removeQuotes: false,
                minifyFontValues: { removeQuotes: false },
                calc: false,
                colormin: false,
                convertValues: false,
                discardEmpty: false,
                discardOverridden: false,
                mergeLonghand: false,
                mergeRules: false,
                minifyGradients: false,
                minifyParams: false,
                minifySelectors: false,
                normalizeCharset: false,
                normalizeDisplayValues: false,
                normalizePositions: false,
                normalizeRepeatStyle: false,
                reduceIdents: false,
                reduceInitial: false,
                reduceTransforms: false,
                svgo: false,
                uniqueSelectors: false,
                zindex: false,
              },
            ],
          },
          parallel: true,
          include: /\.css$/i,
          exclude: /\.module\.css$/i,
        }),
      ],
    },
    resolve: {
      // This allows you to set a fallback for where webpack should look for modules.
      // We placed these paths second because we want `node_modules` to "win"
      // if there are any conflicts. This matches Node resolution mechanism.
      // https://github.com/facebook/create-react-app/issues/253
      modules: [
        path.resolve(__dirname, "../src"),
        path.resolve(__dirname, "../packages/design-system/widgets/src"),
        "node_modules",
      ],
      alias: {
        "~": path.resolve(__dirname, "../node_modules"),
        // Handle emotion packages
        "@emotion/react": path.resolve(
          __dirname,
          "../node_modules/@emotion/react",
        ),
        "@emotion/styled": path.resolve(
          __dirname,
          "../node_modules/@emotion/styled",
        ),
        "@emotion/core": path.resolve(
          __dirname,
          "../node_modules/@emotion/react",
        ),
        "emotion-theming": path.resolve(
          __dirname,
          "../node_modules/@emotion/react",
        ),
        // Add src directory aliases
        Datasource: path.resolve(__dirname, "../src/Datasource"),
        IDE: path.resolve(__dirname, "../src/IDE"),
        PluginActionEditor: path.resolve(
          __dirname,
          "../src/PluginActionEditor",
        ),
        WidgetProvider: path.resolve(__dirname, "../src/WidgetProvider"),
        WidgetQueryGenerators: path.resolve(
          __dirname,
          "../src/WidgetQueryGenerators",
        ),
        actions: path.resolve(__dirname, "../src/actions"),
        api: path.resolve(__dirname, "../src/api"),
        assets: path.resolve(__dirname, "../src/assets"),
        ce: path.resolve(__dirname, "../src/ce"),
        components: path.resolve(__dirname, "../src/components"),
        constants: path.resolve(__dirname, "../src/constants"),
        ee: path.resolve(__dirname, "../src/ee"),
        enterprise: path.resolve(__dirname, "../src/enterprise"),
        entities: path.resolve(__dirname, "../src/entities"),
        git: path.resolve(__dirname, "../src/git"),
        globalStyles: path.resolve(__dirname, "../src/globalStyles"),
        icons: path.resolve(__dirname, "../src/icons"),
        instrumentation: path.resolve(__dirname, "../src/instrumentation"),
        layoutSystems: path.resolve(__dirname, "../src/layoutSystems"),
        mockResponses: path.resolve(__dirname, "../src/mockResponses"),
        mocks: path.resolve(__dirname, "../src/mocks"),
        modules: path.resolve(__dirname, "../src/modules"),
        navigation: path.resolve(__dirname, "../src/navigation"),
        pages: path.resolve(__dirname, "../src/pages"),
        plugins: path.resolve(__dirname, "../src/plugins"),
        polyfills: path.resolve(__dirname, "../src/polyfills"),
        reducers: path.resolve(__dirname, "../src/reducers"),
        reflow: path.resolve(__dirname, "../src/reflow"),
        sagas: path.resolve(__dirname, "../src/sagas"),
        selectors: path.resolve(__dirname, "../src/selectors"),
        templates: path.resolve(__dirname, "../src/templates"),
        theme: path.resolve(__dirname, "../src/theme"),
        usagePulse: path.resolve(__dirname, "../src/usagePulse"),
        utils: path.resolve(__dirname, "../src/utils"),
        widgets: path.resolve(__dirname, "../src/widgets"),
        workers: path.resolve(__dirname, "../src/workers"),
        // Support React Native Web
        // https://www.smashingmagazine.com/2016/08/a-glimpse-into-the-future-with-react-native-for-web/
        "react-native": "react-native-web",
        // Add alias for @appsmith/wds
        "@appsmith/wds": path.resolve(
          __dirname,
          "../packages/design-system/widgets",
        ),
        // Add alias for CodeMirror
        codemirror: path.resolve(__dirname, "../node_modules/codemirror"),
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
        "@codemirror/language": false,
      },
      mainFields: ["browser", "module", "main"],
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
      plugins: [
        // Prevents users from importing files from outside of src/ (or node_modules/).
        // This often causes confusion because we only process files within src/ with babel.
        // To fix this, we prevent you from importing files out of src/ -- if you'd like to,
        // please link the files into your node_modules/ and let module-resolution kick in.
        // Make sure your source files are compiled, as they will not be processed in any way.
        new ModuleScopePlugin(
          [
            paths.appSrc,
            paths.appNodeModules,
            path.resolve(paths.appPath, "packages"),
          ],
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
        // // Handle node_modules packages that contain sourcemaps
        // {
        //   enforce: "pre",
        //   exclude: [/@blueprintjs\/.+\.css$/],
        //   test: /\.(js|mjs|jsx|ts|tsx|css)$/,
        //   loader: require.resolve("source-map-loader"),
        //   options: {
        //     filterSourceMappingUrl: (url, resourcePath) => {
        //       // Ignore sourcemaps for node_modules
        //       if (/node_modules/.test(resourcePath)) {
        //         return false;
        //       }
        //       return true;
        //     },
        //   },
        // },
        {
          test: /\.m?js/,
          resolve: { fullySpecified: false },
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
            // Process application TS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(ts|tsx)$/,
              include: [paths.appSrc, path.resolve(paths.appPath, "packages")],
              use: [
                {
                  loader: require.resolve("babel-loader"),
                  options: {
                    babelrc: false,
                    presets: [
                      [
                        "@babel/preset-env",
                        {
                          targets: {
                            node: "20.11.1",
                          },
                          modules: false,
                          useBuiltIns: "entry",
                          corejs: {
                            version: "3.35",
                            proposals: true,
                          },
                          // exclude: ["transform-classes"],
                        },
                      ],
                      [
                        "@babel/preset-typescript",
                        {
                          allowDeclareFields: true,
                          onlyRemoveTypeImports: true,
                        },
                      ],
                      [
                        "@babel/preset-react",
                        {
                          runtime: hasJsxRuntime ? "automatic" : "classic",
                          development: isEnvDevelopment,
                          importSource: "@emotion/react",
                        },
                      ],
                    ],
                    plugins: [
                      ["@emotion/babel-plugin", { sourceMap: true }],
                      ["@babel/plugin-proposal-decorators", { legacy: true }],
                      [
                        "@babel/plugin-transform-class-properties",
                        { loose: true },
                      ],
                      [
                        "@babel/plugin-transform-private-methods",
                        { loose: true },
                      ],
                      [
                        "@babel/plugin-transform-private-property-in-object",
                        { loose: true },
                      ],
                      isEnvDevelopment &&
                        shouldUseReactRefresh &&
                        require.resolve("react-refresh/babel"),
                    ].filter(Boolean),
                    cacheDirectory: true,
                    cacheCompression: false,
                    compact: isEnvProduction,
                  },
                },
              ],
            },
            // Handle JS files
            {
              test: /\.(js|mjs|jsx)$/,
              include: paths.appSrc,
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                presets: [
                  [
                    "@babel/preset-env",
                    {
                      targets: {
                        node: "20.11.1",
                      },
                      modules: false,
                      useBuiltIns: "entry",
                      corejs: {
                        version: "3.35",
                        proposals: true,
                      },
                      exclude: ["transform-classes"],
                    },
                  ],
                  [
                    "@babel/preset-react",
                    {
                      runtime: hasJsxRuntime ? "automatic" : "classic",
                      development: isEnvDevelopment,
                    },
                  ],
                ],
                cacheDirectory: true,
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
                sourceMaps: shouldUseSourceMap,
                inputSourceMap: shouldUseSourceMap,
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
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
                modules: {
                  mode: "icss",
                },
              }),
              include: [paths.appSrc, path.resolve(paths.appPath, "packages")],
              sideEffects: true,
            },
            // CSS Modules
            {
              test: cssModuleRegex,
              use: getStyleLoaders({
                importLoaders: 1,
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
                modules: {
                  mode: "local",
                  getLocalIdent: getCSSModuleLocalIdent,
                },
              }),
              include: [paths.appSrc, path.resolve(paths.appPath, "packages")],
            },
            // Adds support for CSS Modules, but using SASS
            // using the extension .module.scss or .module.sass
            {
              test: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                  modules: {
                    mode: "local",
                    getLocalIdent: getCSSModuleLocalIdent,
                  },
                },
                "sass-loader",
              ),
            },
            // SASS
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              use: getStyleLoaders(
                {
                  importLoaders: 3,
                  sourceMap: isEnvProduction
                    ? shouldUseSourceMap
                    : isEnvDevelopment,
                  modules: {
                    mode: "icss",
                  },
                },
                "sass-loader",
              ),
              sideEffects: true,
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
          ],
        },
      ].filter(Boolean),
    },
    plugins: [
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
          exclude: [/node_modules/, /bootstrap\.js$/],
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
          ignoreOrder: true,
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
      // Add WorkboxPlugin for service worker
      new WorkboxWebpackPlugin.InjectManifest({
        swSrc: "./src/serviceWorker.ts",
        mode: "development",
        swDest: "./pageService.js",
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        exclude: [
          /\.map$/,
          /^manifest.*\.js$/,
          /index\.html/,
          /LICENSE\.txt/,
          /\/*\.svg$/,
        ],
        dontCacheBustURLsMatching: /\.[0-9a-zA-Z]{8}\.chunk\.(js|css)$/,
      }),
      // Add Babel plugin for Lodash optimization
      new webpack.LoaderOptionsPlugin({
        options: {
          babel: {
            plugins: ["babel-plugin-lodash"],
            loaderOptions: {
              cacheDirectory: false,
            },
          },
        },
      }),
      // Replace BlueprintJS's icon component with our own implementation
      new webpack.NormalModuleReplacementPlugin(
        /@blueprintjs\/core\/lib\/\w+\/components\/icon\/icon\.\w+/,
        require.resolve(
          path.resolve(
            __dirname,
            "../src/components/designSystems/blueprintjs/icon/index.js",
          ),
        ),
      ),
      isEnvProduction && new CompressionPlugin(),
      isEnvProduction &&
        new CompressionPlugin({
          algorithm: "brotliCompress",
          filename: "[path][base].br",
          test: /\.(js|css|html|svg)$/,
          threshold: 10240,
          minRatio: 0.8,
        }),
      isEnvProduction &&
        new RetryChunkLoadPlugin({
          retryDelay: 3000,
          maxRetries: 2,
          lastResortScript: "window.location.href='/404.html';",
        }),
      isEnvProduction &&
        (appEnvironment === "PRODUCTION" || appEnvironment === "STAGING") &&
        new FaroSourceMapUploaderPlugin({
          appId: process.env.REACT_APP_FARO_APP_ID,
          appName: process.env.REACT_APP_FARO_APP_NAME,
          endpoint: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_ENDPOINT,
          stackId: process.env.REACT_APP_FARO_STACK_ID,
          apiKey: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_API_KEY,
          gzipContents: true,
        }),
      // Type checking
      !process.env.SKIP_TYPE_CHECK &&
        new ForkTsCheckerWebpackPlugin({
          async: isEnvDevelopment,
          typescript: {
            typescriptPath: resolve.sync("typescript", {
              basedir: paths.appNodeModules,
            }),
            configOverwrite: {
              compilerOptions: {
                sourceMap: isEnvProduction
                  ? shouldUseSourceMap
                  : isEnvDevelopment,
                skipLibCheck: true,
                inlineSourceMap: false,
                declarationMap: false,
                noEmit: true,
                incremental: true,
                tsBuildInfoFile: paths.appTsBuildInfoFile,
              },
            },
            context: paths.appPath,
            diagnosticOptions: {
              syntactic: true,
            },
            mode: "write-references",
          },
          issue: {
            include: [
              { file: "../**/src/**/*.{ts,tsx}" },
              { file: "**/src/**/*.{ts,tsx}" },
            ],
            exclude: [
              { file: "**/src/**/__tests__/**" },
              { file: "**/src/**/?(*.){spec|test}.*" },
              { file: "**/src/setupProxy.*" },
              { file: "**/src/setupTests.*" },
            ],
          },
          logger: {
            infrastructure: "silent",
          },
        }),
      !disableESLintPlugin &&
        new ESLintPlugin({
          // Plugin options
          extensions: ["js", "mjs", "jsx", "ts", "tsx"],
          formatter: require.resolve("react-dev-utils/eslintFormatter"),
          eslintPath: require.resolve("eslint"),
          failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
          context: paths.appSrc,
          cache: true,
          cacheLocation: path.resolve(
            paths.appNodeModules,
            ".cache/.eslintcache",
          ),
          // ESLint class options
          cwd: paths.appPath,
          resolvePluginsRelativeTo: __dirname,
          baseConfig: {
            extends: [require.resolve("eslint-config-react-app/base")],
            rules: {
              ...(!hasJsxRuntime && {
                "react/react-in-jsx-scope": "error",
              }),
            },
          },
        }),
    ].filter(Boolean),
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: {
              ecma: 8,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
            },
            mangle: {
              safari10: true,
            },
            keep_classnames: isEnvProductionProfile,
            keep_fnames: isEnvProductionProfile,
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
        new CssMinimizerPlugin(),
      ],
    },
    // Turn off performance processing because we utilize
    // our own hints via the FileSizeReporter
    performance: false,
  };
};
