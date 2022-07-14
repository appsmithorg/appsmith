const glob = require("glob");
const path = require("path");
const { summaries } = require("./summary");
const { saveToSupabase } = require("./ci/supabase");
var cp = require("child_process");
var fs = require("fs");

// Create the directory
global.APP_ROOT = path.join(__dirname, ".."); //Going back one level from src folder to /perf
const dir = `${APP_ROOT}/traces/reports`;
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

glob("./tests/*.perf.js", {}, async function(er, files) {
  // Initial setup
  const setupLogs = await cp.execSync(`node ./tests/initial-setup.js`);

  fs.writeFileSync(`${dir}/setup.log`, setupLogs.toString());

  files.forEach(async (file) => {
    const testSuiteName = file
      .split("/")
      .pop()
      .replace(".perf.js", "");

    const logs = await cp.execSync(`node ${file}`, { stdio: "inherit" }); // Logging to terminal, log it to a file in future?
    fs.writeFileSync(`${dir}/${testSuiteName}.log`, logs.toString());
  });
  await summaries(`${APP_ROOT}/traces/reports`);
  await saveToSupabase();
});
