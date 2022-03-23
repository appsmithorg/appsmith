const fs = require("fs");
const path = require("path");

const delay = (time, msg = "") => {
  console.log(`waiting ${msg}:`, time / 1000, "s");
  return new Promise(function(resolve) {
    setTimeout(resolve, time);
  });
};

exports.delay = delay;

exports.getDevToolsPage = async (browser) => {
  const targets = await browser.targets();
  const devtoolsTarget = targets.filter((t) => {
    return t.type() === "other" && t.url().startsWith("devtools://");
  })[0];

  // Hack to get a page pointing to the devtools
  devtoolsTarget._targetInfo.type = "page";
  const devtoolsPage = await devtoolsTarget.page();
  return devtoolsPage;
};

exports.gotoProfiler = async (devtoolsPage) => {
  await devtoolsPage.bringToFront();
  await devtoolsPage.keyboard.down("MetaLeft");
  await devtoolsPage.keyboard.press("[");
  await devtoolsPage.keyboard.up("MetaLeft");
};

exports.getProfilerFrame = async (devtoolsPage) => {
  const frames = await devtoolsPage.frames();
  const reactProfiler = frames[2]; // This is not foolproof
  return reactProfiler;
};

exports.startReactProfile = async (reactProfiler) => {
  const recordButton =
    "#container > div > div > div > div > div.Toolbar___30kHu > button.Button___1-PiG.InactiveRecordToggle___2CUtF";
  await reactProfiler.waitForSelector(recordButton);
  const container = await reactProfiler.$(recordButton);
  console.log("Starting recording");
  await reactProfiler.evaluate((el) => el.click(), container);
  console.log("Recording started");
};

exports.stopReactProfile = async (reactProfiler) => {
  const stopRecordingButton =
    "#container > div > div > div > div > div.Toolbar___30kHu > button.Button___1-PiG.ActiveRecordToggle___1Cpcb";
  await reactProfiler.waitForSelector(stopRecordingButton);
  const container = await reactProfiler.$(stopRecordingButton);
  console.log("Stopping recording");
  await reactProfiler.evaluate((el) => el.click(), container);
  console.log("Recording stopped");
};

exports.downloadReactProfile = async (reactProfiler) => {
  const saveProfileButton =
    "#container > div > div > div > div.LeftColumn___3I7-I > div.Toolbar___30kHu > button:nth-child(8)";
  await reactProfiler.waitForSelector(saveProfileButton);
  const container = await reactProfiler.$(saveProfileButton);
  await reactProfiler.evaluate((el) => el.click(), container);
  console.log("Downloaded the profile");
};

exports.saveProfile = async (reactProfiler, name) => {
  const anchorSelector =
    "#container > div > div > div > div.LeftColumn___3I7-I > div.Toolbar___30kHu > a";
  await reactProfiler.waitForSelector(anchorSelector);
  const anchor = await reactProfiler.$(anchorSelector);
  await reactProfiler.evaluate(
    (el) => console.log(el.getAttribute("href")),
    anchor,
  );
  const attr = await reactProfiler.$$eval(anchorSelector, (el) =>
    el.map((x) => x.getAttribute("href")),
  );

  const url = attr[0];

  const profile = await reactProfiler.evaluate(async (href) => {
    const blob = await fetch(href).then(async (r) => r.blob());
    const text = await blob.text();
    return text;
  }, url);
  const location = path.join(__dirname, `/profiles/${name}.json`);
  fs.writeFileSync(location, profile);
};

exports.login = async (page) => {
  const url = "https://dev.appsmith.com/user/login";

  await page.goto(url);
  await page.setViewport({ width: 1920, height: 1080 });

  await delay(1000, "before login");

  const emailSelector = "input[name='username']";
  const passwordSelector = "input[name='password']";
  const buttonSelector = "button[type='submit']";

  await page.waitForSelector(emailSelector);
  await page.waitForSelector(passwordSelector);
  await page.waitForSelector(buttonSelector);

  await page.type(emailSelector, "hello@myemail.com");
  await page.type(passwordSelector, "qwerty1234");
  delay(1000, "before clicking login button");
  await page.click(buttonSelector);
};

exports.getFormattedTime = () => {
  var today = new Date();
  var y = today.getFullYear();
  var m = today.getMonth() + 1;
  var d = today.getDate();
  var h = today.getHours();
  var mi = today.getMinutes();
  var s = today.getSeconds();
  return y + "-" + m + "-" + d + "-" + h + "-" + mi + "-" + s;
};

exports.sortObjectKeys = (obj) => {
  const sortedObj = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sortedObj[key] = obj[key];
    });
  return sortedObj;
};

exports.makeid = (length = 8) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
