'use strict';

const fs = require('fs');
const path = require('path');
const paths = require('./paths');
const chalk = require('react-dev-utils/chalk');
const resolve = require('resolve');
const ts = require('typescript');

/**
 * Get additional module paths based on the baseUrl of a compilerOptions object.
 *
 * @param {Object} options
 */
function getAdditionalModulePaths(options = {}) {
  const baseUrl = options.baseUrl;

  // We need to explicitly check for null and undefined (and not a falsy value) because
  // TypeScript can be explicitly configured to use [''] as the baseUrl.
  if (baseUrl == null) {
    const config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config;
    const { baseUrl: tsConfigBaseUrl } = config.compilerOptions || {};
    if (tsConfigBaseUrl) {
      return [path.resolve(paths.appPath, tsConfigBaseUrl)];
    }
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  // We don't need to do any glob matching since TypeScript's path mappings are based on baseUrl
  if (path.relative(paths.appNodeModules, baseUrlResolved) === '') {
    return null;
  }

  if (path.relative(paths.appSrc, baseUrlResolved) === '') {
    return null;
  }

  // Otherwise, throw an error.
  throw new Error(
    chalk.red.bold(
      "Your project's `baseUrl` can only be set to `src` or `node_modules`." +
        ' Create React App does not support other values at this time.'
    )
  );
}

/**
 * Get webpack aliases based on the baseUrl of a compilerOptions object.
 *
 * @param {*} options
 */
function getWebpackAliases(options = {}) {
  const baseUrl = options.baseUrl;

  if (!baseUrl) {
    const config = ts.readConfigFile(paths.appTsConfig, ts.sys.readFile).config;
    const { baseUrl: tsConfigBaseUrl, paths: tsConfigPaths } = config.compilerOptions || {};
    
    if (tsConfigBaseUrl && tsConfigPaths) {
      const webpackAliases = {};
      Object.keys(tsConfigPaths).forEach(key => {
        const path = tsConfigPaths[key][0];
        if (path) {
          webpackAliases[key.replace('/*', '')] = path.replace('/*', '');
        }
      });
      return webpackAliases;
    }
    return {};
  }

  const baseUrlResolved = path.resolve(paths.appPath, baseUrl);

  if (path.relative(paths.appPath, baseUrlResolved) === '') {
    return {
      src: paths.appSrc,
    };
  }
}

module.exports = {
  getAdditionalModulePaths,
  getWebpackAliases,
};
