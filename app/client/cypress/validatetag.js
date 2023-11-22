const fs = require('fs');
const path = require('path');
const { Tag } = require('./tags');

function extractTagsFromTestFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Regular expression to match the describe block and extract the tags
  const describeBlockRegex = /describe\s*\(\s*["'`](.*?)["'`]\s*,\s*({[\s\S]*?})\s*,\s*[\s\S]*?\)/g;
  const matches = describeBlockRegex.exec(fileContent);

  if (matches && matches.length >= 3) {
    const tagsObj = eval(`(${matches[2]})`); // Parse the tags object
    if (tagsObj.tags && Array.isArray(tagsObj.tags)) {
      return tagsObj.tags;
    }
  }
  return [];
}

function checkTagsValidity(filePath) {
  try {
    const extractedTags = extractTagsFromTestFile(filePath);
    const invalidTags = extractedTags.filter(tag => !Tag.includes(tag));

    if (invalidTags.length > 0) {
      throw new Error(`Invalid tag(s) found in file '${filePath}': ${invalidTags.join(", ")}. Allowed tags are: ${Tag.join(", ")}`);
    }
    console.log(`Tags in file '${filePath}' are valid.`);
  } catch (error) {
    console.error(error.message);
  }
}

// Retrieve file paths from command line arguments (excluding the first two arguments: node path and script name)
const relativeFilePaths = process.argv.slice(2);

// Get the current working directory
const currentWorkingDirectory = process.cwd();

// Remove 'app/client/' from the current working directory and append the relative file path
const absoluteFilePaths = relativeFilePaths.map(relativePath => {
  const updatedPath = path.join(currentWorkingDirectory.replace(/app\/client\//g, ''), relativePath);
  return path.resolve(updatedPath);
});

// Process each file path
absoluteFilePaths.forEach(filePath => {
  checkTagsValidity(filePath);
});
