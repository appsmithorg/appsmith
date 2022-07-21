const fs = require("fs");
const path = require("path");
const sd = require("node-stdev");

var median = require("median");

exports.summaries = async (directory) => {
  const results = await parseReports(
    directory,
    ["scripting", "painting", "rendering"],
    [],
  );

  generateMarkdown(results);
};

const parseReports = async (
  directory,
  summaryFields = [],
  warningFields = [],
) => {
  const files = await fs.promises.readdir(directory);
  const results = {};
  files.forEach((file) => {
    if (file.endsWith(".json")) {
      const content = require(`${directory}/${file}`);
      Object.keys(content).forEach((key) => {
        if (!results[key]) {
          results[key] = {};
        }
        summaryFields.forEach((summaryField) => {
          if (!results[key][summaryField]) {
            results[key][summaryField] = [];
          }
          results[key][summaryField].push(
            parseFloat(content[key].summary[summaryField].toFixed(2)),
          );
        });
        warningFields.forEach((warningField) => {
          if (!results[key][warningField]) {
            results[key][warningField] = [];
          }
          results[key][warningField].push(
            parseFloat(content[key].warnings[warningField]),
          );
        });
      });
    }
  });
  return results;
};
const getMaxSize = (results) => {
  let size = 0;
  Object.keys(results).forEach((key) => {
    const action = results[key];
    size = Math.max(action["scripting"].length, size);
  });

  return size;
};

const generateMarkdown = (results) => {
  const size = getMaxSize(results);
  let markdown = `<details><summary>Click to view performance test results</summary>\n\n| `;
  for (let i = 0; i < size; i++) {
    markdown = markdown + `| Run ${i + 1} `;
  }
  markdown = markdown + `| Median | Mean | SD.Sample | SD.Population`;

  markdown += "|\n";

  for (let i = 0; i <= size + 4; i++) {
    markdown = markdown + `| ------------- `;
  }
  markdown += "|\n";

  Object.keys(results).forEach((key) => {
    const action = results[key];
    markdown += `**${key}**`;
    for (let i = 0; i <= size + 4; i++) {
      markdown += `| `;
    }
    markdown += "|\n";

    Object.keys(action).forEach((key) => {
      const length = action[key].length;
      markdown += `| ${key} | `;
      markdown += action[key].reduce((sum, val) => `${sum} | ${val} `);
      if (length < size) {
        for (let i = 0; i < size - action[key].length; i++) {
          markdown += " | ";
        }
      }
      // Add median
      markdown += `| ${median(action[key])}`;
      // Add average
      const avg = parseFloat(
        (action[key].reduce((sum, val) => sum + val, 0) / length).toFixed(2),
      );
      markdown += `| ${avg} | ${((sd.sample(action[key]) / avg) * 100).toFixed(
        2,
      )} | ${((sd.population(action[key]) / avg) * 100).toFixed(2)}`;

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

exports.parseReports = parseReports;
