'use strict';

// Set memory limit to 10GB
process.env.NODE_OPTIONS = '--max-old-space-size=16000';

// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const path = require('path');
const fs = require('fs-extra');
const chalk = require('react-dev-utils/chalk');
const webpack = require('webpack');
const configFactory = require('../config/webpack.config');
const paths = require('../config/paths');
const formatWebpackMessages = require('react-dev-utils/formatWebpackMessages');
const FileSizeReporter = require('react-dev-utils/FileSizeReporter');
const printBuildError = require('react-dev-utils/printBuildError');

console.log(chalk.cyan('Starting production build with the following environment:'));
console.log(chalk.cyan('- BABEL_ENV:'), chalk.yellow(process.env.BABEL_ENV));
console.log(chalk.cyan('- NODE_ENV:'), chalk.yellow(process.env.NODE_ENV));
console.log();

const measureFileSizesBeforeBuild = FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

// These sizes are pretty large. We'll warn for bundles exceeding them.
const WARN_AFTER_BUNDLE_GZIP_SIZE = 512 * 1024;
const WARN_AFTER_CHUNK_GZIP_SIZE = 1024 * 1024;

// Makes the script crash on unhandled rejections instead of silently
// ignoring them.
process.on('unhandledRejection', err => {
  console.error(chalk.red('❌ Build failed due to unhandled rejection:'));
  console.error(err);
  throw err;
});

// Start the build process
async function main() {
  try {
    console.log(chalk.cyan('Preparing build directory...'));
    // Cleanup the build directory
    fs.emptyDirSync(paths.appBuild);
    console.log(chalk.green('✓ Build directory cleaned'));
    console.log();

    console.log(chalk.cyan('Measuring initial file sizes...'));
    // First, read the current file sizes in build directory.
    // This lets us display how much they changed later.
    const previousFileSizes = await measureFileSizesBeforeBuild(paths.appBuild);
    console.log(chalk.green('✓ Initial file sizes measured'));
    console.log();

    // Copy public folder
    console.log(chalk.cyan('Copying public folder...'));
    fs.copySync(paths.appPublic, paths.appBuild, {
      dereference: true,
      filter: file => file !== paths.appHtml,
    });
    console.log(chalk.green('✓ Public folder copied'));
    console.log();

    // Start the webpack build
    const results = await build(previousFileSizes);

    // Print the file sizes after build
    console.log();
    console.log(chalk.cyan('File sizes after gzip:'));
    printFileSizesAfterBuild(
      results.stats,
      previousFileSizes,
      paths.appBuild,
      WARN_AFTER_BUNDLE_GZIP_SIZE,
      WARN_AFTER_CHUNK_GZIP_SIZE
    );
    console.log();

    const buildFolder = path.relative(process.cwd(), paths.appBuild);
    console.log(chalk.green('✨ Build completed successfully!'));
    console.log();
    console.log(chalk.cyan('The'), chalk.yellow(buildFolder), chalk.cyan('directory is ready to be deployed.'));
    console.log();

    if (results.warnings.length) {
      console.log(chalk.yellow('Build completed with warnings:'));
      console.log();
      results.warnings.forEach(warning => {
        console.log(chalk.yellow('  • ' + warning));
      });
      console.log();
    }
  } catch (err) {
    console.error(chalk.red('❌ Build failed with error:'));
    console.error(err);
    process.exit(1);
  }
}

// Create the production build and print the deployment instructions.
async function build(previousFileSizes) {
  console.log(chalk.cyan('Creating an optimized production build...'));
  console.log();

  const config = configFactory('production');

  // Log webpack configuration details
  console.log(chalk.cyan('Webpack configuration overview:'));
  console.log(chalk.cyan('- Entry point:'), chalk.yellow(config.entry));
  console.log(chalk.cyan('- Output path:'), chalk.yellow(config.output.path));
  console.log(chalk.cyan('- Source maps:'), chalk.yellow(config.devtool || 'disabled'));
  console.log(chalk.cyan('- Optimization enabled:'), chalk.yellow(config.optimization.minimize));
  console.log();

  const compiler = webpack(config);

  console.log(chalk.cyan('Starting webpack compilation...'));
  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      let messages;
      if (err) {
        if (!err.message) {
          return reject(err);
        }

        let errMessage = err.message;

        messages = formatWebpackMessages({
          errors: [errMessage],
          warnings: [],
        });
      } else {
        messages = formatWebpackMessages(
          stats.toJson({ all: false, warnings: true, errors: true })
        );
      }

      if (messages.errors.length) {
        // Only keep the first error. Others are often indicative
        // of the same problem, but confuse the reader with noise.
        if (messages.errors.length > 1) {
          messages.errors.length = 1;
        }
        console.error(chalk.red('❌ Failed to compile.\n'));
        console.error(messages.errors.join('\n\n'));
        return reject(new Error(messages.errors.join('\n\n')));
      }

      if (
        process.env.CI &&
        (typeof process.env.CI !== 'string' ||
          process.env.CI.toLowerCase() !== 'false') &&
        messages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            '\nTreating warnings as errors because process.env.CI = true.\n' +
            'Most CI servers set it automatically.\n'
          )
        );
        return reject(new Error(messages.warnings.join('\n\n')));
      }

      // Log successful compilation
      console.log(chalk.green('✓ Compilation completed successfully'));

      // Log compilation stats
      const info = stats.toJson();
      console.log();
      console.log(chalk.cyan('Build statistics:'));
      console.log(chalk.cyan('- Build time:'), chalk.yellow(info.time + 'ms'));
      console.log(chalk.cyan('- Output files:'), chalk.yellow(info.assets.length));
      console.log(chalk.cyan('- Chunks:'), chalk.yellow(info.chunks.length));
      console.log(chalk.cyan('- Modules:'), chalk.yellow(info.modules.length));

      return resolve({
        stats,
        previousFileSizes,
        warnings: messages.warnings,
      });
    });
  });
}

main();
