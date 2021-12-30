const Tracelib = require("tracelib");
const puppeteer = require("puppeteer");
const fs = require("fs");
const {
  delay,
  login,
  getFormattedTime,
  sortObjectKeys,
} = require("./utils/utils");

module.exports = class Perf {
  constructor(launchOptions = {}) {
    this.launchOptions = {
      ...launchOptions,
    };
    this.traces = [];
    this.traceInProgress = false;
    this.browser = null;
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
    if (this.traceInProgress) {
      console.warn("Trace progress. You can run only one trace at a time");
      return;
    }

    this.traceInProgress = true;
    await delay(3000, `before starting trace ${action}`);
    const path = `${APP_ROOT}/traces/${action}-${getFormattedTime()}-chrome-profile.json`;
    await this.page.tracing.start({
      path: path,
      screenshots: true,
    });
    this.traces.push({ action, path });
  };

  stopTrace = async () => {
    this.traceInProgress = false;
    await delay(5000, "before stoping the trace");
    await this.page.tracing.stop();
  };

  getPage = () => {
    if (this.page) return this.page;
    throw Error("Can't find the page, please call launch method.");
  };

  loadDSL = async (dsl) => {
    const selector = ".createnew";
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

    fs.writeFile(
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
