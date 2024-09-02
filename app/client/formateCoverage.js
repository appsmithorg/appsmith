const fs = require('fs');
const path = require('path');
const { Parser } = require('@json2csv/plainjs');

// Define the base path relative to which you want to compute relative paths
const basePath = path.resolve(__dirname, '../../app/client');

// Define the specific directory path for debugging
const debugDirectory = 'src/icons/';

// Load the path groups from a JSON file
const pathGroupsFilePath = path.join(__dirname, 'pathGroups.json');
const pathGroups = JSON.parse(fs.readFileSync(pathGroupsFilePath, 'utf8'));

// Load the coverage summary JSON file
const coverageFilePath = path.join(__dirname, '../../coverage-summary.json');
const coverageData = JSON.parse(fs.readFileSync(coverageFilePath, 'utf8'));

// Define a function to calculate percentage
const calculatePercentage = (covered, total) => (total > 0 ? `${((covered / total) * 100).toFixed(2)}%` : '0.00%');

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

// Initialize a counter for the total number of processed files
let scannedFileCount = 0;

// File list to log all scanned files
const scannedFilePaths = [];

// Process each area in the path groups
Object.keys(pathGroups).forEach((area) => {
  if (!results[area]) {
    results[area] = {
      directories: pathGroups[area],
      lines: { total: 0, covered: 0 },
      statements: { total: 0, covered: 0 },
      functions: { total: 0, covered: 0 },
      branches: { total: 0, covered: 0 },
    };
  }
});

// Process each file in the coverage data
Object.keys(coverageData).forEach((filePath) => {
  // Skip the "total" entry, as it is not a file
  if (filePath === "total" || processedFiles.has(filePath)) return;

  let matched = false;
  Object.keys(pathGroups).forEach((area) => {
    if (matched) return;

    pathGroups[area].forEach((subPath) => {
      if (matched) return;

      // Ensure subPath is a directory path and ends with a slash
      const normalizedSubPath = subPath.endsWith('/') ? subPath : `${subPath}/`;

      // Calculate relative file path based on the base path
      const fullPath = path.resolve(basePath, filePath);
      const relativePath = path.relative(basePath, fullPath);

      // Check if the relative file path starts with subPath
      if (relativePath.startsWith(normalizedSubPath)) {
        matched = true;
        const { lines, statements, functions, branches } = coverageData[filePath];

        // Add the file path to results for the matched area
        results[area].lines.total += lines.total;
        results[area].lines.covered += lines.covered;
        results[area].statements.total += statements.total;
        results[area].statements.covered += statements.covered;
        results[area].functions.total += functions.total;
        results[area].functions.covered += functions.covered;
        results[area].branches.total += branches.total;
        results[area].branches.covered += branches.covered;

        scannedFilePaths.push(relativePath); // Add to scanned file list
        processedFiles.add(filePath);
        scannedFileCount += 1;

        // Debugging output for specific directory
        if (relativePath.startsWith(debugDirectory)) {
          console.log(`\nDebug Directory (${debugDirectory}):`);
          console.log(`File Path: ${relativePath}`);
          console.log(`Lines Total: ${lines.total}, Covered: ${lines.covered}, Percentage: ${calculatePercentage(lines.covered, lines.total)}`);
          console.log(`Statements Total: ${statements.total}, Covered: ${statements.covered}, Percentage: ${calculatePercentage(statements.covered, statements.total)}`);
          console.log(`Functions Total: ${functions.total}, Covered: ${functions.covered}, Percentage: ${calculatePercentage(functions.covered, functions.total)}`);
          console.log(`Branches Total: ${branches.total}, Covered: ${branches.covered}, Percentage: ${calculatePercentage(branches.covered, branches.total)}`);
        }
      }
    });
  });

  if (!matched) {
    const { lines, statements, functions, branches } = coverageData[filePath];

    // Calculate relative file path based on the base path
    const fullPath = path.resolve(basePath, filePath);
    const relativePath = path.relative(basePath, fullPath);

    otherPaths.lines.total += lines.total;
    otherPaths.lines.covered += lines.covered;
    otherPaths.statements.total += statements.total;
    otherPaths.statements.covered += statements.covered;
    otherPaths.functions.total += functions.total;
    otherPaths.functions.covered += functions.covered;
    otherPaths.branches.total += branches.total;
    otherPaths.branches.covered += branches.covered;

    // Add the file path to Other_Paths
    otherPathsList.push(relativePath);
    scannedFilePaths.push(relativePath); // Add to scanned file list
    processedFiles.add(filePath);
    scannedFileCount += 1;

    console.log(`Added file path to Other_Paths: ${relativePath}`);
  }
});

// Include Other_Paths in results only if there are actual files
if (otherPaths.lines.total > 0) {
  results['Other_Paths'] = {
    directories: otherPathsList,
    lines: otherPaths.lines,
    statements: otherPaths.statements,
    functions: otherPaths.functions,
    branches: otherPaths.branches,
  };
}

// Prepare data for CSV
const finalResults = [];
Object.keys(results).forEach((area) => {
  const { directories, lines, statements, functions, branches } = results[area];

  const totalDirectories = directories.join(', ');

  finalResults.push({
    Area: area,
    Directories: totalDirectories,
    Lines: calculatePercentage(lines.covered, lines.total),
    Statements: calculatePercentage(statements.covered, statements.total),
    Functions: calculatePercentage(functions.covered, functions.total),
    Branches: calculatePercentage(branches.covered, branches.total),
  });
});

// Convert to CSV
const parser = new Parser({ fields: ['Area', 'Directories', 'Lines', 'Statements', 'Functions', 'Branches'], delimiter: ';' });
const csv = parser.parse(finalResults);

// Define the file path for CSV
const csvFilePath = path.join(__dirname, 'coverage-summary.csv');

// Clear the file if it exists or create a new one
fs.writeFileSync(csvFilePath, '');

// Write the new content to the file
fs.writeFileSync(csvFilePath, csv);

console.log('CSV file created/cleared and written successfully:', csvFilePath);
console.log('Number of files scanned and added to the report:', scannedFileCount);

// Write the list of scanned files to a separate file
const scannedFilesFilePath = path.join(__dirname, 'scanned-files.txt');
fs.writeFileSync(scannedFilesFilePath, scannedFilePaths.join('\n'));

console.log('List of scanned file paths written successfully:', scannedFilesFilePath);

// Print final calculated entries for debugDirectory
console.log('\nFinal Calculated Entries for Debug Directory:');
Object.keys(results).forEach((area) => {
  const { lines, statements, functions, branches } = results[area];
  
  // Only print for debugDirectory
  if (results[area].directories.some(dir => dir.startsWith(debugDirectory))) {
    console.log(`\nArea: ${area}`);
    console.log(`Lines Total: ${lines.total}, Covered: ${lines.covered}, Percentage: ${calculatePercentage(lines.covered, lines.total)}`);
    console.log(`Statements Total: ${statements.total}, Covered: ${statements.covered}, Percentage: ${calculatePercentage(statements.covered, statements.total)}`);
    console.log(`Functions Total: ${functions.total}, Covered: ${functions.covered}, Percentage: ${calculatePercentage(functions.covered, functions.total)}`);
    console.log(`Branches Total: ${branches.total}, Covered: ${branches.covered}, Percentage: ${calculatePercentage(branches.covered, branches.total)}`);
  }
});