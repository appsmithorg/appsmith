'use strict';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const chalk = require('react-dev-utils/chalk');
const fs = require('fs');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const checkRequiredFiles = require('react-dev-utils/checkRequiredFiles');
const {
  choosePort,
  createCompiler,
  prepareProxy,
  prepareUrls,
} = require('react-dev-utils/WebpackDevServerUtils');
const openBrowser = require('react-dev-utils/openBrowser');
const semver = require('semver');
const paths = require('../config/paths');
const configFactory = require('../config/webpack.config');
const createDevServerConfig = require('../config/webpackDevServer.config');
const getClientEnvironment = require('../config/env');
const react = require('react');

console.log(chalk.cyan('Starting development server with the following environment:'));
console.log(chalk.cyan('- BABEL_ENV:'), chalk.yellow(process.env.BABEL_ENV));
console.log(chalk.cyan('- NODE_ENV:'), chalk.yellow(process.env.NODE_ENV));

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', err => {
  console.error(chalk.red('Unhandled rejection:'), err);
  throw err;
});

// Ensure environment variables are read.
require('../config/env');

const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));
const useYarn = fs.existsSync(paths.yarnLockFile);
// Set isInteractive to false to prevent console clearing
const isInteractive = false;

// Warn and crash if required files are missing
if (!checkRequiredFiles([paths.appHtml, paths.appIndexJs])) {
  process.exit(1);
}

// Tools like Cloud9 rely on this.
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

if (process.env.HOST) {
  console.log(
    chalk.cyan(
      `Attempting to bind to HOST environment variable: ${chalk.yellow(
        chalk.bold(process.env.HOST)
      )}`
    )
  );
  console.log(
    `If this was unintentional, check that you haven't mistakenly set it in your shell.`
  );
  console.log(
    `Learn more here: ${chalk.yellow('https://cra.link/advanced-config')}`
  );
  console.log();
}

console.log(chalk.cyan(`Attempting to start server on host ${chalk.yellow(HOST)} with default port ${chalk.yellow(DEFAULT_PORT)}`));

choosePort(HOST, DEFAULT_PORT)
  .then(port => {
    if (port == null) {
      console.log(chalk.red('No available port found.'));
      return;
    }

    console.log(chalk.cyan(`Port ${chalk.yellow(port)} is available. Creating webpack configuration...`));
    const config = configFactory('development');
    
    console.log(chalk.cyan('Webpack configuration created with the following features:'));
    console.log(chalk.cyan('- Entry point:'), chalk.yellow(config.entry));
    console.log(chalk.cyan('- Output path:'), chalk.yellow(config.output.path));
    console.log(chalk.cyan('- Dev tool:'), chalk.yellow(config.devtool));

    const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
    const appName = require(paths.appPackageJson).name;

    const useTypeScript = fs.existsSync(paths.appTsConfig);
    console.log(chalk.cyan('TypeScript support:'), chalk.yellow(useTypeScript ? 'Enabled' : 'Disabled'));

    const urls = prepareUrls(
      protocol,
      HOST,
      port,
      paths.publicUrlOrPath.slice(0, -1)
    );

    console.log(chalk.cyan('Server URLs prepared:'));
    console.log(chalk.cyan('- Local:'), chalk.yellow(urls.localUrlForBrowser));
    console.log(chalk.cyan('- Network:'), chalk.yellow(urls.lanUrlForConfig));

    // Create a webpack compiler that is configured with custom messages.
    console.log(chalk.cyan('Creating webpack compiler...'));
    const compiler = createCompiler({
      appName,
      config,
      urls,
      useYarn,
      useTypeScript,
      webpack,
    });

    // Load proxy config
    console.log(chalk.cyan('Loading proxy configuration...'));
    const proxySetting = require(paths.appPackageJson).proxy;
    const proxyConfig = prepareProxy(
      proxySetting,
      paths.appPublic,
      paths.publicUrlOrPath
    );

    if (proxySetting) {
      console.log(chalk.cyan('Proxy configuration detected:'), chalk.yellow(JSON.stringify(proxySetting, null, 2)));
    }

    // Create the WebpackDevServer configuration
    console.log(chalk.cyan('Creating WebpackDevServer configuration...'));
    const serverConfig = createDevServerConfig(proxyConfig, urls.lanUrlForConfig);

    // Customize server configuration
    console.log(chalk.cyan('Customizing server configuration...'));
    const devServerConfig = {
      ...serverConfig,
      host: HOST,
      port,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        logging: 'verbose', // Set client logging to verbose
        webSocketURL: {
          hostname: HOST,
          pathname: '/ws',
          port,
          protocol: protocol === 'https' ? 'wss' : 'ws',
        },
      },
      devMiddleware: {
        publicPath: paths.publicUrlOrPath.slice(0, -1),
        writeToDisk: false,
      },
      static: {
        directory: paths.appPublic,
        publicPath: paths.publicUrlOrPath.slice(0, -1),
        watch: true,
      },
      historyApiFallback: {
        disableDotRule: true,
        index: paths.publicUrlOrPath,
      },
      hot: true,
      compress: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*',
      },
    };

    console.log(chalk.cyan('Server configuration created with:'));
    console.log(chalk.cyan('- Host:'), chalk.yellow(devServerConfig.host));
    console.log(chalk.cyan('- Port:'), chalk.yellow(devServerConfig.port));
    console.log(chalk.cyan('- Public Path:'), chalk.yellow(devServerConfig.devMiddleware.publicPath));
    console.log(chalk.cyan('- Hot Reload:'), chalk.yellow(devServerConfig.hot ? 'Enabled' : 'Disabled'));
    console.log(chalk.cyan('- Compression:'), chalk.yellow(devServerConfig.compress ? 'Enabled' : 'Disabled'));

    console.log(chalk.cyan('Creating WebpackDevServer instance...'));
    const devServer = new WebpackDevServer(devServerConfig, compiler);

    // Launch WebpackDevServer
    console.log(chalk.cyan('Starting WebpackDevServer...'));
    devServer.startCallback(() => {
      if (env.raw.FAST_REFRESH && semver.lt(react.version, '16.10.0')) {
        console.log(
          chalk.yellow(
            `Fast Refresh requires React 16.10 or higher. You are using React ${react.version}.`
          )
        );
      }

      console.log(chalk.green('Development server started successfully!'));
      console.log();
      console.log(chalk.cyan('You can now view'), chalk.bold(appName), chalk.cyan('in the browser.'));
      console.log();
      console.log(chalk.cyan('  Local:            '), chalk.yellow(urls.localUrlForBrowser));
      console.log(chalk.cyan('  On Your Network:  '), chalk.yellow(urls.lanUrlForConfig));
      console.log();
      console.log(chalk.cyan('Note that the development build is not optimized.'));
      console.log(chalk.cyan('To create a production build, use'), chalk.yellow('yarn build'), chalk.cyan('.'));
      console.log();

      openBrowser(urls.localUrlForBrowser);
    });

    ['SIGINT', 'SIGTERM'].forEach(function (sig) {
      process.on(sig, function () {
        console.log(chalk.yellow(`\nReceived ${sig}. Closing dev server...`));
        devServer.close();
        process.exit();
      });
    });

    if (process.env.CI !== 'true') {
      // Gracefully exit when stdin ends
      process.stdin.on('end', function () {
        console.log(chalk.yellow('\nReceived end of stdin. Closing dev server...'));
        devServer.close();
        process.exit();
      });
    }
  })
  .catch(err => {
    console.error(chalk.red('Failed to start development server:'));
    if (err && err.message) {
      console.error(chalk.red(err.message));
    } else {
      console.error(chalk.red(err));
    }
    process.exit(1);
  });
