const Tracelib = require("tracelib");
const puppeteer = require("puppeteer");
var sanitize = require("sanitize-filename");
const fs = require("fs");
const path = require("path");

const {
  delay,
  login,
  getFormattedTime,
  sortObjectKeys,
} = require("./utils/utils");
const selectors = {
  appMoreIcon: "span.t--options-icon",
  orgImportAppOption: '[data-cy*="t--org-import-app"]',
  fileInput: "#fileInput",
  importButton: '[data-cy*="t--org-import-app-button"]',
  createNewApp: ".createnew",
};
module.exports = class Perf {
  constructor(launchOptions = {}) {
    this.launchOptions = {
      defaultViewport: null,
      args: ["--window-size=1920,1080"],
      ignoreHTTPSErrors: true, // @todo Remove it after initial testing
      ...launchOptions,
    };

    if (process.env.PERF_TEST_ENV === "dev") {
      this.launchOptions.executablePath =
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
      this.launchOptions.devtools = true;
      this.launchOptions.headless = false;
    }

    this.traces = [];
    this.currentTrace = null;
    this.browser = null;

    // Initial setup
    this.currentTestFile = process.argv[1]
      .split("/")
      .pop()
      .replace(".perf.js", "");
    global.APP_ROOT = path.join(__dirname, ".."); //Going back one level from src folder to /perf
    process.on("unhandledRejection", async (reason, p) => {
      console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
      const fileName = sanitize(
        `${this.currentTestFile}__${this.currentTrace}`,
      );
      const screenshotPath = `${APP_ROOT}/traces/reports/${fileName}-${getFormattedTime()}.png`;
      await this.page.screenshot({
        path: screenshotPath,
      });
      if (this.currentTrace) {
        await this.stopTrace();
      }
      this.browser.close();
    });
  }
  /**
   * Launches the browser and, gives you the page
   */
  launch = async () => {
    this.browser = await puppeteer.launch(this.launchOptions);
    const pages_ = await this.browser.pages();
    this.page = pages_[0];
    await this._login();
  };

  _login = async () => {
    await login(this.page);
    await delay(2000, "after login");
  };

  startTrace = async (action = "foo") => {
    if (this.currentTrace) {
      console.warn("Trace progress. You can run only one trace at a time");
      return;
    }

    this.currentTrace = action;
    await delay(3000, `before starting trace ${action}`);
    const path = `${APP_ROOT}/traces/${action}-${getFormattedTime()}-chrome-profile.json`;
    await this.page.tracing.start({
      path: path,
      screenshots: true,
    });
    this.traces.push({ action, path });
  };

  stopTrace = async () => {
    this.currentTrace = null;
    await delay(3000, "before stopping the trace");
    await this.page.tracing.stop();
  };

  getPage = () => {
    if (this.page) return this.page;
    throw Error("Can't find the page, please call launch method.");
  };

  loadDSL = async (dsl) => {
    const selector = selectors.createNewApp;
    await this.page.waitForSelector(selector);
    await this.page.click(selector);
    // We goto the newly created app.
    // Lets update the page
    await this.page.waitForNavigation();

    const currentUrl = this.page.url();
    const pageIdRegex = /pages(.*)/;
    const match = pageIdRegex.exec(currentUrl);
    const pageId = match[1].split("/")[1];

    await this.page.evaluate(
      async ({ pageId, dsl }) => {
        const layoutId = await fetch(`/api/v1/pages/${pageId}`)
          .then((response) => response.json())
          .then((data) => data.data.layouts[0].id);

        const pageSaveUrl = "/api/v1/layouts/" + layoutId + "/pages/" + pageId;
        await fetch(pageSaveUrl, {
          headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
          },

          referrerPolicy: "strict-origin-when-cross-origin",
          body: JSON.stringify(dsl),
          method: "PUT",
          mode: "cors",
          credentials: "include",
        })
          .then((res) =>
            console.log("Save page with new DSL response:", res.json()),
          )
          .catch((err) => {
            console.log("Save page with new DSL error:", err);
          });
      },
      { pageId, dsl },
    );
    await this.page.goto(currentUrl.replace("generate-page", ""), {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
  };

  importApplication = async (jsonPath) => {
    await this.page.waitForSelector(selectors.appMoreIcon);
    await this.page.click(selectors.appMoreIcon);
    await this.page.waitForSelector(selectors.orgImportAppOption);
    await this.page.click(selectors.orgImportAppOption);

    const elementHandle = await this.page.$(selectors.fileInput);
    await elementHandle.uploadFile(jsonPath);
    await this.page.click(selectors.importButton);

    await this.page.waitForNavigation();
    await this.page.reload();
  };

  generateReport = async () => {
    const report = {};
    this.traces.forEach(({ path, action }) => {
      report[action] = {};
      const trace = require(path);
      const tasks = new Tracelib.default(trace.traceEvents);
      report[action].path = path;
      report[action].summary = sortObjectKeys(tasks.getSummary());
      report[action].warnings = sortObjectKeys(tasks.getWarningCounts());
    });

    await fs.writeFile(
      `${APP_ROOT}/traces/reports/${getFormattedTime()}.json`,
      JSON.stringify(report, "", 4),
      (err) => {
        if (err) {
          console.log("Error writing file", err);
        } else {
          console.log("Successfully wrote report");
        }
      },
    );
  };

  close = async () => {
    this.browser.close();
  };
};
