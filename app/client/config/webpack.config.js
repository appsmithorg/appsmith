// Node.js built-in modules for file system and path operations
const fs = require('fs');
const path = require('path');
// Core webpack module
const webpack = require('webpack');
// Used to resolve module paths
const resolve = require('resolve');
// Plugin to generate HTML file and inject bundles
const HtmlWebpackPlugin = require('html-webpack-plugin');
// Enforces case sensitivity in file paths
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
// Inlines runtime chunks into HTML
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
// JavaScript minification plugin
const TerserPlugin = require('terser-webpack-plugin');
// Extracts CSS into separate files
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// Optimizes and minimizes CSS
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
// Generates manifest of all assets
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
// Interpolates variables in HTML
const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
// Service worker generation
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
// Restricts which files can be imported
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
// Generates unique identifiers for CSS modules
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
// ESLint integration
const ESLintPlugin = require('eslint-webpack-plugin');
// TypeScript type checking in a separate process
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// Project paths configuration
const paths = require('./paths');
// Module resolution configuration
const modules = require('./modules');
// Environment variables configuration
const getClientEnvironment = require('./env');
// Handles module not found errors
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
// React Fast Refresh support
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
// Compresses assets
const CompressionPlugin = require('compression-webpack-plugin');
// Retries loading chunks that failed to load
const { RetryChunkLoadPlugin } = require('webpack-retry-chunk-load-plugin');
// Source map uploader for monitoring
const FaroSourceMapUploaderPlugin = require('@grafana/faro-webpack-plugin');

// Environment configuration flags
const shouldUseSourceMap = process.env.GENERATE_SOURCEMAP !== 'false';
const shouldInlineRuntimeChunk = process.env.INLINE_RUNTIME_CHUNK !== 'false';
const emitErrorsAsWarnings = process.env.ESLINT_NO_DEV_ERRORS === 'true';
const disableESLintPlugin = process.env.DISABLE_ESLINT_PLUGIN === 'false';
const shouldUseReactRefresh = process.env.FAST_REFRESH !== 'false';

// Maximum size for inlining images as base64
const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);

// Check if project uses TypeScript
const useTypeScript = fs.existsSync(paths.appTsConfig);

// Get environment variables for client-side code
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

// Webpack configuration function
module.exports = function (webpackEnv) {
  // Determine if we're in development or production mode
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
  const isEnvProductionProfile = isEnvProduction && process.env.PROFILE === 'true';

  // Function to configure style loaders (CSS, SASS, etc.)
  const getStyleLoaders = (cssOptions, preProcessor) => {
    // Array of loaders to use for styles
    const loaders = [
      // Use style-loader in development for hot reload
      isEnvDevelopment && require.resolve('style-loader'),
      // Use MiniCssExtractPlugin in production for CSS files
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: paths.publicUrlOrPath.startsWith('.') ? { publicPath: '../../' } : {},
      },
      // CSS loader with specified options
      {
        loader: require.resolve('css-loader'),
        options: cssOptions,
      },
      // PostCSS loader for CSS transformations
      {
        loader: require.resolve('postcss-loader'),
        options: {
          postcssOptions: {
            plugins: [
              // Adds vendor prefixes
              require('postcss-flexbugs-fixes'),
              [
                require('postcss-preset-env'),
                {
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                },
              ],
              // Minimize in production
              isEnvProduction && require('postcss-normalize')(),
            ].filter(Boolean),
          },
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      },
    ].filter(Boolean);

    // Add preprocessor if specified (e.g., sass-loader)
    if (preProcessor) {
      loaders.push({
        loader: require.resolve(preProcessor),
        options: {
          sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
        },
      });
    }

    return loaders;
  };

  return {
    // Set mode based on environment
    mode: isEnvProduction ? 'production' : 'development',

    // Target web platform instead of using browserslist
    target: 'web',

    // Stop compilation on first error in production
    bail: isEnvProduction,

    // Configure source maps
    devtool: isEnvProduction
      ? shouldUseSourceMap
        ? 'source-map'
        : false
      : isEnvDevelopment && 'cheap-module-source-map',

    // Entry points for the application
    entry: paths.appIndexJs,

    // Output configuration
    output: {
      // Build output directory
      path: paths.appBuild,
      // Add content hash to filenames in production for cache busting
      filename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].js'
        : isEnvDevelopment && 'static/js/bundle.js',
      // Chunk filename pattern
      chunkFilename: isEnvProduction
        ? 'static/js/[name].[contenthash:8].chunk.js'
        : isEnvDevelopment && 'static/js/[name].chunk.js',
      // Public URL for assets
      publicPath: paths.publicUrlOrPath,
      // Point sourcemap entries to original disk locations
      devtoolModuleFilenameTemplate: isEnvProduction
        ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, '/')
        : info => path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    },

    // Cache configuration for faster rebuilds
    cache: {
      type: 'filesystem',
      version: require('./webpack/persistentCache/createEnvironmentHash')(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: 'pack',
      compression: 'gzip',
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter(f =>
          fs.existsSync(f)
        ),
      },
      maxAge: 172800000, // 2 days
    },

    // Infrastructure logging configuration
    infrastructureLogging: {
      level: 'none',
    },

    // Optimization configuration
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
              drop_console: isEnvProduction,
              drop_debugger: isEnvProduction,
              pure_funcs: isEnvProduction ? ['console.log', 'console.info', 'console.debug'] : [],
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
          parallel: true,
          extractComments: false,
        }),
        new CssMinimizerPlugin({
          parallel: true,
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                minifyFontValues: { removeQuotes: false },
              },
            ],
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Handle cases where module.context is undefined/null
              if (!module.context) return 'vendor';

              const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
              // If no match is found, return a default vendor name
              if (!match) return 'vendor';

              const packageName = match[1];
              return `vendor.${packageName.replace('@', '')}`;
            },
            priority: 10,
          },
          common: {
            test: /[\\/]src[\\/]/,
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`,
      },
      removeEmptyChunks: true,
      mergeDuplicateChunks: true,
      removeAvailableModules: true,
    },

    // Module resolution configuration
    resolve: {
      // Configure how modules are resolved
      extensions: paths.moduleFileExtensions.map(ext => `.${ext}`),
      modules: [
        paths.appSrc, // Add src directory for absolute imports
        'node_modules',
        paths.appNodeModules
      ].concat(
        modules.additionalModulePaths || [],
      ),
      alias: {
        ...(modules.webpackAliases || {}),
        // Add path aliases for ce and ee directories
        ce: path.resolve(paths.appSrc, 'ce'),
        ee: path.resolve(paths.appSrc, 'ee'),
        // Add aliases for @appsmith packages
        '@appsmith/ads': path.resolve(paths.appPath, 'packages/design-system/ads/src'),
        '@appsmith/ads-old': path.resolve(paths.appPath, 'packages/design-system/ads-old/src'),
        '@appsmith/design-system': path.resolve(paths.appPath, 'packages/design-system'),
        '@appsmith/widgets': path.resolve(paths.appPath, 'packages/design-system/widgets/src'),
        '@appsmith/widgets-old': path.resolve(paths.appPath, 'packages/design-system/widgets-old/src'),
        '@appsmith/wds': path.resolve(paths.appPath, 'packages/design-system/widgets/src'),
        '@appsmith/ast': path.resolve(paths.appPath, 'packages/ast/src'),
        '@appsmith/dsl': path.resolve(paths.appPath, 'packages/dsl/src'),
        '@appsmith/icons': path.resolve(paths.appPath, 'packages/icons/src'),
        '@appsmith/utils': path.resolve(paths.appPath, 'packages/utils/src'),
        '@appsmith/rts': path.resolve(paths.appPath, 'packages/rts/src')
      },
      fallback: {
        "crypto": false,
        "stream": false,
        "assert": false,
        "http": false,
        "https": false,
        "os": false,
        "url": path.resolve(paths.appSrc, 'polyfills/url.js'),
        "zlib": false,
        "path": false,
        "module": false,
        "buffer": false,
        "util": false,
        "fs": false,
        "process": false,
        "querystring": false,
        "timers": false,
        "child_process": false,
        "vm": false,
        "tls": false,
        "net": false,
        "dns": false
      },
      plugins: [
        // Allow imports from both src/ and workspace packages
        new ModuleScopePlugin([
          paths.appSrc,
          paths.appNodeModules,
          path.resolve(paths.appPath, 'packages'),
        ], [
          paths.appPackageJson,
          ...fs.readdirSync(path.resolve(paths.appPath, 'packages'))
            .filter(pkg => !pkg.startsWith('.'))  // Ignore hidden files/folders
            .map(pkg => path.resolve(paths.appPath, 'packages', pkg, 'package.json'))
            .filter(pkgPath => fs.existsSync(pkgPath))
        ]),
      ],
      symlinks: true, // Enable symlink resolution for workspaces
      exportsFields: ['exports'],
      importsFields: ['imports'],
      conditionNames: ['import', 'require', 'node', 'default'],
      fullySpecified: false,
    },

    // Module rules configuration
    module: {
      strictExportPresence: true,
      rules: [
        // Handle node_modules packages that contain sourcemaps
        shouldUseSourceMap && {
          enforce: 'pre',
          exclude: /@babel(?:\/|\\{1,2})runtime/,
          test: /\.(js|mjs|jsx|ts|tsx|css)$/,
          use: 'source-map-loader',
        },
        {
          // Handle node: scheme imports
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false,
            fallback: {
              crypto: require.resolve('crypto-browserify'),
              stream: require.resolve('stream-browserify'),
              assert: require.resolve('assert'),
              http: require.resolve('stream-http'),
              https: require.resolve('https-browserify'),
              os: require.resolve('os-browserify/browser'),
              url: require.resolve('url'),
              buffer: require.resolve('buffer'),
            },
          },
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
              type: 'asset',
              mimetype: 'image/avif',
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            // Process application JS with Babel.
            // The preset includes JSX, Flow, TypeScript, and some ESnext features.
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: [
                paths.appSrc,
                path.resolve(paths.appPath, 'packages'),
              ],
              loader: require.resolve('babel-loader'),
              options: {
                customize: require.resolve(
                  'babel-preset-react-app/webpack-overrides'
                ),
                presets: [
                  [
                    require.resolve('babel-preset-react-app'),
                    {
                      runtime: 'automatic',
                    },
                  ],
                ],
                plugins: [
                  isEnvDevelopment &&
                  shouldUseReactRefresh &&
                  require.resolve('react-refresh/babel'),
                  require.resolve('babel-plugin-styled-components'),
                ].filter(Boolean),
                // This is a feature of `babel-loader` for webpack (not Babel itself).
                // It enables caching results in ./node_modules/.cache/babel-loader/
                // directory for faster rebuilds.
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            // Handle LESS files
            {
              test: /\.less$/,
              use: [
                isEnvDevelopment ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 3,
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                    modules: {
                      mode: 'icss',
                    },
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    postcssOptions: {
                      plugins: [
                        require('postcss-flexbugs-fixes'),
                        [
                          require('postcss-preset-env'),
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        isEnvProduction && require('postcss-normalize')(),
                      ].filter(Boolean),
                    },
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
                {
                  loader: require.resolve('less-loader'),
                  options: {
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
              ],
            },
            // Handle Blueprint CSS
            {
              test: /blueprint-datetime.*\.css$/,
              use: [
                isEnvDevelopment ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    postcssOptions: {
                      plugins: [
                        require('postcss-flexbugs-fixes'),
                        [
                          require('postcss-preset-env'),
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        isEnvProduction && require('postcss-normalize')(),
                      ].filter(Boolean),
                    },
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
              ],
            },
            // Handle regular CSS
            {
              test: /\.css$/,
              exclude: /\.module\.css$/,
              include: [
                paths.appSrc,
                path.resolve(paths.appPath, 'packages'),
                /node_modules/,
              ],
              use: [
                isEnvDevelopment ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    postcssOptions: {
                      plugins: [
                        require('postcss-flexbugs-fixes'),
                        [
                          require('postcss-preset-env'),
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        isEnvProduction && require('postcss-normalize')(),
                      ].filter(Boolean),
                    },
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
              ],
              sideEffects: true,
            },
            // Handle CSS Modules
            {
              test: /\.module\.css$/,
              include: [
                paths.appSrc,
                path.resolve(paths.appPath, 'packages'),
              ],
              use: [
                isEnvDevelopment ? require.resolve('style-loader') : MiniCssExtractPlugin.loader,
                {
                  loader: require.resolve('css-loader'),
                  options: {
                    importLoaders: 1,
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                    modules: {
                      mode: 'local',
                      getLocalIdent: getCSSModuleLocalIdent,
                    },
                  },
                },
                {
                  loader: require.resolve('postcss-loader'),
                  options: {
                    postcssOptions: {
                      plugins: [
                        require('postcss-flexbugs-fixes'),
                        [
                          require('postcss-preset-env'),
                          {
                            autoprefixer: {
                              flexbox: 'no-2009',
                            },
                            stage: 3,
                          },
                        ],
                        isEnvProduction && require('postcss-normalize')(),
                      ].filter(Boolean),
                    },
                    sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
                  },
                },
              ],
            },
            // Handle Lottie animation files
            {
              test: /\.json\.txt$/,
              type: 'asset/source',
            },
            // Handle images
            {
              test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: 'asset',
              parser: {
                dataUrlCondition: {
                  maxSize: imageInlineSizeLimit,
                },
              },
            },
            // Handle SVG
            {
              test: /\.svg$/,
              oneOf: [
                {
                  issuer: /\.[jt]sx?$/,
                  use: [
                    {
                      loader: require.resolve('@svgr/webpack'),
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
                      loader: require.resolve('file-loader'),
                      options: {
                        name: 'static/media/[name].[hash].[ext]',
                      },
                    },
                  ],
                },
                {
                  type: 'asset/resource',
                },
              ],
            },
            // Handle Web Workers
            {
              test: /\.worker\.(js|ts)$/,
              use: [
                {
                  loader: require.resolve('worker-loader'),
                  options: {
                    filename: 'static/js/[name].[contenthash:8].worker.js',
                  },
                },
                {
                  loader: require.resolve('babel-loader'),
                  options: {
                    presets: [
                      [require.resolve('@babel/preset-env')],
                      useTypeScript && [require.resolve('@babel/preset-typescript')],
                    ].filter(Boolean),
                    plugins: [
                      [require.resolve('@babel/plugin-transform-runtime')],
                    ],
                    cacheDirectory: true,
                    cacheCompression: false,
                    compact: isEnvProduction,
                  },
                },
              ],
            },
          ],
        },
      ].filter(Boolean),
    },

    // Plugin configuration
    plugins: [
      // Generates index.html file
      new HtmlWebpackPlugin({
        inject: true,
        template: paths.appHtml,
        ...(isEnvProduction
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
          : undefined),
      }),
      // Handle node: protocol imports
      new webpack.NormalModuleReplacementPlugin(/^node:(.*)$/, (resource) => {
        const mod = resource.request.replace(/^node:/, '');
        if (mod === 'url') {
          resource.request = path.resolve(paths.appSrc, 'polyfills/url.js');
        } else {
          resource.request = mod;
        }
      }),
      isEnvProduction && shouldInlineRuntimeChunk &&
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      new ModuleNotFoundPlugin(paths.appPath),
      new webpack.DefinePlugin(env.stringified),
      isEnvDevelopment && shouldUseReactRefresh && new ReactRefreshWebpackPlugin({
        overlay: false,
      }),
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvProduction && new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash:8].css',
        chunkFilename: 'static/css/[name].[contenthash:8].chunk.css',
      }),
      new WebpackManifestPlugin({
        fileName: 'asset-manifest.json',
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(
            fileName => !fileName.endsWith('.map')
          );

          return {
            files: manifestFiles,
            entrypoints: entrypointFiles,
          };
        },
      }),
      // TypeScript type checking
      new ForkTsCheckerWebpackPlugin({
        async: isEnvDevelopment,
        typescript: {
          typescriptPath: resolve.sync('typescript', {
            basedir: paths.appNodeModules,
          }),
          configOverwrite: {
            compilerOptions: {
              sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
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
          mode: 'write-references',
        },
        issue: {
          include: [
            { file: '../**/src/**/*.{ts,tsx}' },
            { file: '**/src/**/*.{ts,tsx}' }
          ],
          exclude: [
            { file: '**/src/**/__tests__/**' },
            { file: '**/src/**/?(*.){spec|test}.*' },
            { file: '**/src/setupProxy.*' },
            { file: '**/src/setupTests.*' },
            { file: '**/packages/**/*' }
          ],
        },
        logger: {
          infrastructure: 'silent',
        },
      }),
      // Service Worker configuration
      isEnvDevelopment && new WorkboxWebpackPlugin.InjectManifest({
        swSrc: './src/serviceWorker.ts',
        mode: 'development',
        swDest: './pageService.js',
        exclude: [
          /\.map$/,
          /^manifest.*\.js$/,
          /index\.html/,
          /LICENSE/,
        ],
      }),
      isEnvProduction && new WorkboxWebpackPlugin.InjectManifest({
        swSrc: './src/serviceWorker.ts',
        mode: 'production',
        swDest: './pageService.js',
        exclude: [
          /\.map$/,
          /^manifest.*\.js$/,
          /index\.html/,
          /LICENSE/,
        ],
      }),
      useTypeScript && new ForkTsCheckerWebpackPlugin({
        async: isEnvDevelopment,
        typescript: {
          typescriptPath: resolve.sync('typescript', {
            basedir: paths.appNodeModules,
          }),
          configOverwrite: {
            compilerOptions: {
              sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
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
          mode: 'write-references',
        },
        issue: {
          include: [
            { file: '../**/src/**/*.{ts,tsx}' },
            { file: '**/src/**/*.{ts,tsx}' }
          ],
          exclude: [
            { file: '**/src/**/__tests__/**' },
            { file: '**/src/**/?(*.){spec|test}.*' },
            { file: '**/src/setupProxy.*' },
            { file: '**/src/setupTests.*' },
            { file: '**/packages/**/*' }
          ],
        },
        logger: {
          infrastructure: 'silent',
        },
      }),
      !disableESLintPlugin && new ESLintPlugin({
        extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
        formatter: require.resolve('react-dev-utils/eslintFormatter'),
        eslintPath: require.resolve('eslint'),
        failOnError: !(isEnvDevelopment && emitErrorsAsWarnings),
        context: paths.appSrc,
        cache: true,
        cacheLocation: path.resolve(paths.appNodeModules, '.cache/.eslintcache'),
        cwd: paths.appPath,
        resolvePluginsRelativeTo: paths.appPath,
        baseConfig: {
          extends: [require.resolve('eslint-config-react-app/base')],
        },
      }),
      isEnvProduction && new CompressionPlugin({
        filename: '[path][base].gz',
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
      isEnvProduction && new CompressionPlugin({
        filename: '[path][base].br',
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        minRatio: 0.8,
      }),
      isEnvProduction && new RetryChunkLoadPlugin({
        cacheBust: function () {
          return `?retry=${Date.now()}`;
        },
        maxRetries: 2,
        retryDelay: 3000,
        lastResortScript: "window.location.href='/404.html';",
      }),
      isEnvProduction && process.env.REACT_APP_ENVIRONMENT !== 'DEVELOPMENT' && new FaroSourceMapUploaderPlugin({
        appId: process.env.REACT_APP_FARO_APP_ID,
        appName: process.env.REACT_APP_FARO_APP_NAME,
        endpoint: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_ENDPOINT,
        stackId: process.env.REACT_APP_FARO_STACK_ID,
        apiKey: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_API_KEY,
        gzipContents: true,
      }),
      new webpack.NormalModuleReplacementPlugin(/^node:(.*)$/, (resource) => {
        const mod = resource.request.replace(/^node:/, '');
        if (mod === 'url') {
          resource.request = path.resolve(paths.appSrc, 'polyfills/url.js');
        } else {
          resource.request = mod;
        }
      }),
    ].filter(Boolean),

    // Disable performance optimization
    performance: {
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
      hints: isEnvProduction ? 'warning' : false,
    },
  };
};
