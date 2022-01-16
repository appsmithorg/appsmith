const CracoAlias = require("craco-alias");
const { addAfterLoader, removeLoaders, loaderByName, getLoaders, throwUnexpectedConfigError } = require('@craco/craco');
const { ESBuildMinifyPlugin } = require('esbuild-loader');

const throwError = (message) =>
  throwUnexpectedConfigError({
    packageName: 'craco',
    githubRepo: 'gsoft-inc/craco',
    message,
    githubIssueQuery: 'webpack',
  });

module.exports = {
  style: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: "tsconfig",
        // baseUrl SHOULD be specified
        // plugin does not take it from tsconfig
        baseUrl: "./src",
        // tsConfigPath should point to the file where "baseUrl" and "paths" are specified
        tsConfigPath: "./tsconfig.path.json",
      },
    },
    {
      plugin: "prismjs",
      options: {
        languages: ["javascript"],
        plugins: [],
        theme: "twilight",
        css: false,
      },
    },
  ],
  webpack: {
    configure: (webpackConfig, { paths }) => {
      const { hasFoundAny, matches } = getLoaders(webpackConfig, loaderByName('babel-loader'));
      if (!hasFoundAny) throwError('failed to find babel-loader');

      const { hasRemovedAny, removedCount } = removeLoaders(webpackConfig, loaderByName('babel-loader'));
      if (!hasRemovedAny) throwError('no babel-loader to remove');
      if (removedCount !== 2) throwError('had expected to remove 2 babel loader instances');

      const tsLoader = {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        include: paths.appSrc,
        loader: require.resolve('esbuild-loader'),
        options: {
          loader: 'tsx',
          target: 'es2015'
        },
      };

      const svgLoader = {
        test: /\.svg$/,
        use: [
          {
            loader: '@svgr/webpack',
            options: {
              prettier: false,
              svgo: true,
              svgoConfig: {
                plugins: [{ removeViewBox: false }],
              },
              titleProp: true,
            },
          }, "url-loader"
        ],
      };

      const { isAdded: tsLoaderIsAdded } = addAfterLoader(webpackConfig, loaderByName('url-loader'), tsLoader);
      if (!tsLoaderIsAdded) throwError('failed to add esbuild-loader');
      console.log('added esbuild-loader');

      const { isAdded: tsSVGLoaderIsAdded } = addAfterLoader(webpackConfig, loaderByName('url-loader'), svgLoader);
      if (!tsSVGLoaderIsAdded) throwError('failed to add SVG loader');
      const { isAdded: babelLoaderIsAdded } = addAfterLoader(
        webpackConfig,
        loaderByName('esbuild-loader'),
        matches[1].loader // babel-loader
      );
      if (!babelLoaderIsAdded) throwError('failed to add back babel-loader for non-application JS');

      webpackConfig.optimization.minimizer = [
        new ESBuildMinifyPlugin({
          target: 'es2015'
        })
      ];

      return webpackConfig;
    }
  }
};