const { summaries } = require("./src/summary");
const path = require("path");

global.APP_ROOT = path.join(__dirname); //Going back one level from src folder to /perf

summaries(`${__dirname}/traces/reports`);
