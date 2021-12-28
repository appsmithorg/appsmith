const fs = require("fs");
const path = require("path");

exports.summaries = async (directory) => {
  const files = await fs.promises.readdir(directory);
  const results = {};
  files.forEach((file) => {
    if (file.endsWith(".json")) {
      const content = require(`${APP_ROOT}/traces/reports/${file}`);
      Object.keys(content).forEach((key) => {
        if (!results[key]) {
          results[key] = {};
        }
        if (!results[key]?.scripting) {
          results[key].scripting = [];
        }
        results[key].scripting.push(content[key].summary.scripting);

        if (!results[key]?.painting) {
          results[key].painting = [];
        }
        results[key].painting.push(content[key].summary.painting);

        if (!results[key]?.rendering) {
          results[key].rendering = [];
        }
        results[key].rendering.push(content[key].summary.rendering);
      });
    }
  });
  generateReport(results);
};

const generateReport = (results) => {
  var size = 5;
  Object.keys(results).forEach((key) => {
    const action = results[key];
    Object.keys(action).forEach((key) => {
      size = action[key].length;
      const sum = action[key].reduce((sum, val) => sum + val, 0);
      const avg = (sum / action[key].length).toFixed(2);
      action[key].push(avg);
    });
  });

  generateMarkdown(results, size);
};

const generateMarkdown = (results, size = 5) => {
  let markdown = `<details><summary>Click to view performance test results</summary>\n\n| `;
  for (let i = 0; i < size; i++) {
    markdown = markdown + `| Run #${i + 1} `;
  }
  markdown = markdown + `| Avg `;

  markdown += "|\n";

  for (let i = 0; i <= size + 1; i++) {
    markdown = markdown + `| ------------- `;
  }
  markdown += "|\n";

  Object.keys(results).forEach((key) => {
    const action = results[key];
    markdown = markdown + key;
    for (let i = 0; i <= size; i++) {
      markdown = markdown + `| `;
    }
    markdown += "|\n";
    Object.keys(action).forEach((key) => {
      markdown += `| ${key} | `;
      markdown += action[key].reduce((sum, val) => `${sum} | ${val} `);
      markdown += "| \n";
    });
  });

  markdown += "</details>";

  fs.writeFile(`${APP_ROOT}/traces/reports/summary.md`, markdown, (err) => {
    if (err) {
      console.log("Error writing file", err);
    } else {
      console.log("Successfully wrote summary");
    }
  });
};
