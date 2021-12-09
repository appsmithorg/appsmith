const puppeteer = require("puppeteer");
const Tracelib = require("tracelib");
const { delay, login, getFormattedTime } = require("./utils/utils");

async () => {
  const filePrefix = `${getFormattedTime()}-typing`;
  const profilePath = `./profiles/${filePrefix}-chrome-profile.json`;

  const browser = await puppeteer.launch();
  const pages_ = await browser.pages();
  const page = pages_[0];
  await page.tracing.start({
    path: profilePath,
    screenshots: true,
  });
  await login(page);
  delay(2000);
  await page.tracing.stop();

  const profile = require(profilePath);

  const tasks = new Tracelib.default(profile.traceEvents);

  const summary = tasks.getSummary();
  console.log("__________________SUMMARY___________________");
  console.log(summary);
  const counts = tasks.getWarningCounts();
  console.log("__________________WARNINGS___________________");
  console.log(counts);
};
