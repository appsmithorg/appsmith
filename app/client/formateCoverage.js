const fs = require('fs');
const path = require('path');
const { Parser } = require('@json2csv/plainjs');

// Load the path groups from a JSON file
const pathGroupsFilePath = path.join(__dirname, 'pathGroups.json');
const pathGroups = JSON.parse(fs.readFileSync(pathGroupsFilePath, 'utf8'));

// Load the coverage summary JSON file
const coverageFilePath = path.join(__dirname, '../../coverage-summary.json');
const coverageData = JSON.parse(fs.readFileSync(coverageFilePath, 'utf8'));

// Initialize the result object to accumulate coverage data
const results = {};
const otherPaths = {
  lines: { total: 0, covered: 0 },
  statements: { total: 0, covered: 0 },
  functions: { total: 0, covered: 0 },
  branches: { total: 0, covered: 0 },
};
const otherPathsList = [];

// Track files that have already been processed
const processedFiles = new Set();

// Process each area in the path groups
Object.keys(pathGroups).forEach((area) => {
  if (!results[area]) {
    results[area] = {
      paths: [],
      lines: { total: 0, covered: 0 },
      statements: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
    };
  }

  pathGroups[area].forEach((subPath) => {
    results[area].paths.push(subPath);
  });
});

// Process each file in the coverage data
Object.keys(coverageData).forEach((filePath, index) => {
  // Skip the first line containing total coverage data
  if (index === 0) {
    return;
  }

  if (processedFiles.has(filePath)) {
    return;
  }

  let matched = false;
  Object.keys(pathGroups).forEach((area) => {
    pathGroups[area].forEach((subPath) => {
      if (filePath.includes(subPath)) {
        matched = true;
        const { lines, statements, functions, branches } = coverageData[filePath];

        results[area].lines.total += lines.total;
        results[area].lines.covered += lines.covered;
        results[area].statements.total += statements.total;
        results[area].statements.covered += statements.covered;
        results[area].functions.total += functions.total;
        results[area].functions.covered += functions.covered;
        results[area].branches.total += branches.total;
        results[area].branches.covered += branches.covered;

        processedFiles.add(filePath);
      }
    });
  });

  if (!matched) {
    const { lines, statements, functions, branches } = coverageData[filePath];
    otherPaths.lines.total += lines.total;
    otherPaths.lines.covered += lines.covered;
    otherPaths.statements.total += statements.total;
    otherPaths.statements.covered += statements.covered;
    otherPaths.functions.total += functions.total;
    otherPaths.functions.covered += functions.covered;
    otherPaths.branches.total += branches.total;
    otherPaths.branches.covered += branches.covered;

    otherPathsList.push(filePath);
    processedFiles.add(filePath);
  }
});

// Include Other_Paths in results
if (otherPaths.lines.total > 0) {
  results['Other_Paths'] = {
    paths: otherPathsList,
    lines: otherPaths.lines,
    statements: otherPaths.statements,
    functions: otherPaths.functions,
    branches: otherPaths.branches,
  };
}

// Prepare data for CSV
const finalResults = [];
Object.keys(results).forEach((area) => {
  const { paths, lines, statements, functions, branches } = results[area];

  const totalPaths = paths.join(', ');
  const calculatePercentage = (covered, total) => (total > 0 ? `${((covered / total) * 100).toFixed(2)}%` : '0.00%');

  finalResults.push({
    Area: area,
    Paths: totalPaths,
    Lines: calculatePercentage(lines.covered, lines.total),
    Statements: calculatePercentage(statements.covered, statements.total),
    Functions: calculatePercentage(functions.covered, functions.total),
    Branches: calculatePercentage(branches.covered, branches.total),
  });
});

// Convert to CSV
const parser = new Parser({ fields: ['Area', 'Paths', 'Lines', 'Statements', 'Functions', 'Branches'], delimiter: ';' });
const csv = parser.parse(finalResults);

// Define the file path
const csvFilePath = path.join(__dirname, 'coverage-summary.csv');

// Clear the file if it exists or create a new one
fs.writeFileSync(csvFilePath, '');

// Write the new content to the file
fs.writeFileSync(csvFilePath, csv);

console.log('CSV file created/cleared and written successfully:', csvFilePath);