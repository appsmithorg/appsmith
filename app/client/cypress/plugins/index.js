/// <reference types="cypress" />

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const chalk = require("chalk");
const cypressLogToOutput = require("cypress-log-to-output");
const { isFileExist } = require("cy-verify-downloads");
const {
  addMatchImageSnapshotPlugin,
} = require("cypress-image-snapshot/plugin");

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  // Todo: maybe raise a PR instead of overwriting `on("before:browser:launch", ...)` twice.
  cypressLogToOutput.install(on, (type, event) => {
    if (event.level === "error" || event.type === "error") {
      return true;
    }
    return false;
  });
};

module.exports = (on, config) => {
  on("task", {
    isFileExist,
  });

  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on("before:browser:launch", (browser = {}, launchOptions) => {
    /*
        Uncomment below to get console log printed in cypress output
      */

    launchOptions.args = cypressLogToOutput.browserLaunchHandler(
      browser,
      launchOptions.args,
    );
    if (browser.name === "chrome") {
      launchOptions.args.push("--disable-dev-shm-usage");
      return launchOptions;
    }

    return launchOptions;
  });

  /**
   * Fallback to APPSMITH_* env variables for Cypress.env if config.env doesn't already have it.
   * Note: APPSMITH_* ENV vars have lower precedence than *all* methods mentioned in https://docs.cypress.io/guides/guides/environment-variables.html
   * Example #1:
   * process.env -> APPSMITH_FOO=bar
   * cypress.json -> APPSMITH_FOO=baz
   *
   * Cypress.env("APPSMITH_FOO") // baz
   *
   * Example #2:
   * process.env -> APPSMITH_FOO=bar
   * cypress.json -> APPSMITH_FOO=
   *
   * Cypress.env("APPSMITH_FOO") // <empty>
   */
  Object.keys(process.env).forEach((key) => {
    if (
      key.startsWith("APPSMITH_") &&
      !Object.prototype.hasOwnProperty.call(config.env, key)
    ) {
      config.env[key] = process.env[key];
    }
  });

  /**
   * Fallback to .env variables for Cypress.env if procecss.env doesn't have it either
   * Note: Value in .env file has the lowest precedence, even lower than APPSMITH_* ENV vars.
   * Example:
   * .env -> APPSMITH_FOO=bar
   * process.env -> APPSMITH_FOO=
   *
   * Cypress.env("APPSMITH_FOO") // <empty>
   */
  try {
    const parsedEnv = dotenv.parse(
      fs.readFileSync(path.join(__dirname, "../../../../.env"), {
        encoding: "utf-8",
      }),
    );
    Object.keys(parsedEnv).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(config.env, key)) {
        config.env[key] = parsedEnv[key];
      }
    });
  } catch (e) {
    console.error(
      chalk.yellow(
        "\n====================================================================================================\n" +
          chalk.red(e.message) +
          "\n\n" +
          "Could not load env variables from .env file, make sure you have one!\n" +
          "====================================================================================================\n",
      ),
    );
  }

  /**
   * This task logs the message on the CLI terminal. Use with care because it can log sensitive details
   * Example usage: cy.task('log', 'This is the message printed to the terminal')
   */

  on("task", {
    log(message) {
      console.log(message);
      return null;
    },
  });

  return config;
};
module.exports = (on, config) => {
  addMatchImageSnapshotPlugin(on, config);
};
