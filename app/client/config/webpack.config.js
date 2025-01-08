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
// Project paths configuration
const paths = require('./paths');
// Module resolution configuration
const modules = require('./modules');
// Environment variables configuration
const getClientEnvironment = require('./env');
// Handles module not found errors
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
// TypeScript type checking in a separate process
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
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
      buildDependencies: {
        defaultWebpack: ['webpack/lib/'],
        config: [__filename],
        tsconfig: [paths.appTsConfig, paths.appJsConfig].filter(f =>
          fs.existsSync(f)
        ),
      },
    },

    // Infrastructure logging configuration
    infrastructureLogging: {
      level: 'none',
    },

    // Optimization configuration
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        // JavaScript minification
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
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        }),
        // CSS minification
        new CssMinimizerPlugin(),
      ],
      splitChunks: {
        chunks: chunk => {
          // In development, don't split workbox chunks
          if (!isEnvProduction && /workbox/.test(chunk.name)) {
            return false;
          }
          return true;
        },
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            test: /[\\/]src[\\/]/,
            name: 'common',
            chunks: 'all',
            minChunks: 2,
            priority: 5,
          },
        },
      },
      runtimeChunk: {
        name: entrypoint => `runtime-${entrypoint.name}`,
      },
    },

    // Module resolution configuration
    resolve: {
      // Configure how modules are resolved
      modules: ['node_modules', paths.appNodeModules].concat(
        modules.additionalModulePaths || []
      ),
      extensions: paths.moduleFileExtensions
        .map(ext => `.${ext}`)
        .filter(ext => useTypeScript || !ext.includes('ts')),
      alias: {
        // Support React Native Web
        'react-native': 'react-native-web',
        ...(modules.webpackAliases || {}),
      },
      plugins: [
        // Prevents importing files outside of src/
        new ModuleScopePlugin(paths.appSrc, [
          paths.appPackageJson,
          paths.appTsConfig,
        ]),
      ],
      fallback: {
        path: false,
        fs: false,
      },
    },

    // Module rules configuration
    module: {
      strictExportPresence: true,
      rules: [
        // Handle TypeScript and JavaScript
        {
          test: /\.(js|mjs|jsx|ts|tsx)$/,
          include: [
            paths.appSrc,
            /node_modules\/workbox-*/,
            /node_modules\/@grafana\/faro-react/,
            /node_modules\/@grafana/,
          ],
          exclude: [
            /node_modules[/\\](?!(@grafana|workbox-))/,
          ],
          use: [
            {
              loader: require.resolve('babel-loader'),
              options: {
                babelrc: false,
                configFile: false,
                presets: [
                  [require.resolve('@babel/preset-env'), {
                    targets: {
                      browsers: ['>0.2%', 'not dead', 'not ie <= 11', 'not op_mini all']
                    },
                    modules: false,
                    useBuiltIns: 'usage',
                    corejs: 3,
                    loose: true
                  }],
                  [require.resolve('@babel/preset-typescript'), {
                    isTSX: true,
                    allExtensions: true,
                    allowNamespaces: true,
                    onlyRemoveTypeImports: true
                  }],
                  [require.resolve('@babel/preset-react'), {
                    runtime: 'automatic',
                    development: isEnvDevelopment,
                  }],
                ],
                plugins: [
                  [require.resolve('@babel/plugin-transform-runtime'), {
                    corejs: false,
                    helpers: true,
                    regenerator: true,
                    useESModules: true,
                  }],
                  [require.resolve('@babel/plugin-proposal-decorators'), { legacy: true }],
                  [require.resolve('@babel/plugin-proposal-class-properties'), { loose: true }],
                  [require.resolve('@babel/plugin-proposal-private-methods'), { loose: true }],
                  [require.resolve('@babel/plugin-proposal-private-property-in-object'), { loose: true }],
                  [require.resolve('@babel/plugin-proposal-object-rest-spread'), { loose: true }],
                  isEnvDevelopment && shouldUseReactRefresh && require.resolve('react-refresh/babel'),
                ].filter(Boolean),
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
          ],
        },
        // Handle CSS
        {
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: getStyleLoaders({
            importLoaders: 1,
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            modules: {
              mode: 'icss',
            },
          }),
          sideEffects: true,
        },
        // Handle CSS Modules
        {
          test: /\.module\.css$/,
          use: getStyleLoaders({
            importLoaders: 1,
            sourceMap: isEnvProduction ? shouldUseSourceMap : isEnvDevelopment,
            modules: {
              mode: 'local',
              getLocalIdent: getCSSModuleLocalIdent,
            },
          }),
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
          issuer: {
            and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
          },
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
            { file: '**/src/**/*.{ts,tsx}' },
          ],
          exclude: [
            { file: '**/src/**/__tests__/**' },
            { file: '**/src/**/?(*.){spec|test}.*' },
            { file: '**/src/setupProxy.*' },
            { file: '**/src/setupTests.*' },
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
        cacheBust: `?retry=${Date.now()}`,
        maxRetries: 5,
        retryDelay: 3000,
      }),
      isEnvProduction && process.env.REACT_APP_ENVIRONMENT !== 'DEVELOPMENT' && new FaroSourceMapUploaderPlugin({
        appId: process.env.REACT_APP_FARO_APP_ID,
        appName: process.env.REACT_APP_FARO_APP_NAME,
        endpoint: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_ENDPOINT,
        stackId: process.env.REACT_APP_FARO_STACK_ID,
        apiKey: process.env.REACT_APP_FARO_SOURCEMAP_UPLOAD_API_KEY,
        gzipContents: true,
      }),
    ].filter(Boolean),

    // Disable performance optimization
    performance: false,
  };
};
