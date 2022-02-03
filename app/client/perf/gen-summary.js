const { summaries } = require("./src/summary");

console.log(__dirname);
summaries(`${__dirname}/traces/reports`);
