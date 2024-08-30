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
const otherPaths = { // To track paths not explicitly listed
  lines: { total: 0, covered: 0 },
  statements: { total: 0, covered: 0 },
  functions: { total: 0, covered: 0 },
  branches: { total: 0, covered: 0 },
};

// Process each area in the path groups
Object.keys(pathGroups).forEach((area) => {
  pathGroups[area].forEach((subPath) => {
    results[`${area}:${subPath.replace(/\//g, '_')}`] = {
      lines: { total: 0, covered: 0 },
      statements: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
    };
  });
});

// Process each file in the coverage data
Object.keys(coverageData).forEach((filePath) => {
  let matched = false;
  Object.keys(pathGroups).forEach((area) => {
    pathGroups[area].forEach((subPath) => {
      if (filePath.includes(subPath)) {
        matched = true;
        const resultKey = `${area}:${subPath.replace(/\//g, '_')}`;
        const { lines, statements, functions, branches } = coverageData[filePath];
        
        results[resultKey].lines.total += lines.total;
        results[resultKey].lines.covered += lines.covered;
        results[resultKey].statements.total += statements.total;
        results[resultKey].statements.covered += statements.covered;
        results[resultKey].functions.total += functions.total;
        results[resultKey].functions.covered += functions.covered;
        results[resultKey].branches.total += branches.total;
        results[resultKey].branches.covered += branches.covered;
      }
    });
  });
  if (!matched) {
    // Track coverage data for paths not explicitly listed
    const { lines, statements, functions, branches } = coverageData[filePath];
    otherPaths.lines.total += lines.total;
    otherPaths.lines.covered += lines.covered;
    otherPaths.statements.total += statements.total;
    otherPaths.statements.covered += statements.covered;
    otherPaths.functions.total += functions.total;
    otherPaths.functions.covered += functions.covered;
    otherPaths.branches.total += branches.total;
    otherPaths.branches.covered += branches.covered;
  }
});

// Include Other_Paths in results
if (otherPaths.lines.total > 0) {
  results['Other_Paths'] = {
    lines: otherPaths.lines,
    statements: otherPaths.statements,
    functions: otherPaths.functions,
    branches: otherPaths.branches,
  };
}

// Calculate the average percentages for each category
const finalResults = [];
Object.keys(results).forEach((resultKey) => {
  const { lines, statements, functions, branches } = results[resultKey];
  finalResults.push({
    Paths: resultKey.replace(/_/g, '/').replace(/:/g, '-'), // Adjust the formatting for CSV
    Lines: lines.total > 0 ? `${((lines.covered / lines.total) * 100).toFixed(2)}%` : '0.00%',
    Statements: statements.total > 0 ? `${((statements.covered / statements.total) * 100).toFixed(2)}%` : '0.00%',
    Functions: functions.total > 0 ? `${((functions.covered / functions.total) * 100).toFixed(2)}%` : '0.00%',
    Branches: branches.total > 0 ? `${((branches.covered / branches.total) * 100).toFixed(2)}%` : '0.00%',
  });
});

// Convert to CSV
const parser = new Parser({ fields: ['Paths', 'Lines', 'Statements', 'Functions', 'Branches'], delimiter: ';' });
const csv = parser.parse(finalResults);

// Save CSV file
const csvFilePath = path.join(__dirname, 'coverage-summary.csv');
if (fs.existsSync(csvFilePath)) {
  fs.unlinkSync(csvFilePath); // Delete the file if it already exists
}
fs.writeFileSync(csvFilePath, csv);

console.log('CSV file generated successfully:', csvFilePath);