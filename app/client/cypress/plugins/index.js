/// <reference types="cypress" />
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const chalk = require("chalk");
const cypressLogToOutput = require("cypress-log-to-output");
const installLogsPrinter = require("cypress-terminal-report/src/installLogsPrinter");
const { tagify } = require("cypress-tags");
const { cypressHooks } = require("../scripts/cypress-hooks");
const { dynamicSplit } = require("../scripts/cypress-split-dynamic");
const { staticSplit } = require("../scripts/cypress-split-static");
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

module.exports = async (on, config) => {
  cypressLogToOutput.install(on, (type, event) => {
    if (event.level === "error" || event.type === "error") {
      return true;
    }
    return false;
  });

  const logsPrinterOptions = {
    outputRoot: config.projectRoot + "/cypress/",
    outputTarget: {
      "cypress-logs|json": "json",
    },
    specRoot: "cypress/e2e",
    printLogsToFile: "onFail",
  };
  installLogsPrinter(on, logsPrinterOptions);

  on("file:preprocessor", tagify(config));

  on("before:browser:launch", (browser = {}, launchOptions) => {
    /*
        Uncomment below to get console log printed in cypress output
      */

    launchOptions.args = cypressLogToOutput.browserLaunchHandler(
      browser,
      launchOptions.args,
    );
    if (browser.name === "chrome") {
      const video = path.join(
        "cypress",
        "fixtures",
        "Videos",
        "webCamVideo.y4m",
      );
      launchOptions.args.push("--disable-dev-shm-usage");
      launchOptions.args.push("--window-size=1400,1100");
      launchOptions.args.push("--use-fake-ui-for-media-stream");
      launchOptions.args.push("--use-fake-device-for-media-stream");
      //Stream default video source for camera & code scanner
      launchOptions.args.push(`--use-file-for-fake-video-capture=${video}`);
      return launchOptions;
    }

    if (browser.name === "chromium") {
      launchOptions.args.push("--window-size=1400,1100");
      return launchOptions;
    }

    if (browser.name === "electron") {
      // && browser.isHeadless) {
      launchOptions.preferences.fullscreen = true;
      launchOptions.preferences.darkTheme = true;
      launchOptions.preferences.width = 1400;
      launchOptions.preferences.height = 1100;
      launchOptions.preferences.resizable = false;
      return launchOptions;
    }
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

    /*
    Change video source for for camera & code scanner
    */
    changeVideoSource(videoSource) {
      console.log("TASK - Changing video source to", videoSource);
      const webcamPath = path.join(
        "cypress",
        "fixtures",
        "Videos",
        "webCamVideo.y4m",
      );
      const defaultVideoPath = path.join(
        "cypress",
        "fixtures",
        "Videos",
        videoSource,
      );

      const video = fs.readFileSync(defaultVideoPath);

      fs.writeFile(webcamPath, video);

      return null;
    },

    /*
   Reset video source to default
   */
    resetVideoSource() {
      console.log("TASK - Resetting video source");
      const webcamPath = path.join(
        "cypress",
        "fixtures",
        "Videos",
        "webCamVideo.y4m",
      );
      const defaultVideoPath = path.join(
        "cypress",
        "fixtures",
        "Videos",
        "defaultVideo.y4m",
      );

      const video = fs.readFileSync(defaultVideoPath);

      fs.writeFile(webcamPath, video);

      return null;
    },
  });

  console.log("Type of 'config.specPattern':", typeof config.specPattern);
  /**
   * Cypress grep plug return specPattern as object and with absolute path
   */
  if (typeof config.specPattern == "object") {
    config.specPattern = config.specPattern.map((spec) => {
      return spec.replace(process.cwd() + "/", "");
    });
  }
  console.log("config.specPattern:", config.specPattern);

  if (process.env["RUNID"]) {
    config =
      process.env["CYPRESS_STATIC_ALLOCATION"] == "true"
        ? await new staticSplit().splitSpecs(config)
        : await new dynamicSplit().splitSpecs(config);
    cypressHooks(on, config);
  }

  return config;
};
