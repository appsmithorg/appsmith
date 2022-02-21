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
  await cp.execSync(`node ./tests/initial-setup.js`, { stdio: "inherit" });
  files.forEach(async (file) => {
    await cp.execSync(`node ${file}`, { stdio: "inherit" }); // Logging to terminal, log it to a file in future?
  });
  await summaries(`${APP_ROOT}/traces/reports`);
  await saveToSupabase();
});
