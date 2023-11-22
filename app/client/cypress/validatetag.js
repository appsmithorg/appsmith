const fs = require('fs');
const { Tag } = require('./tags');

const filePath = ''; // Replace with your Cypress test file path


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

function checkTagsValidity(tags) {
  const invalidTags = tags.filter(tag => !Tag.includes(tag));
  if (invalidTags.length > 0) {
    throw new Error(`Invalid tag(s) found: ${invalidTags.join(", ")}. Allowed tags are: ${Tag.join(", ")}`);
  }
}

// Extract tags from the test file
try {
  const extractedTags = extractTagsFromTestFile(filePath);
  checkTagsValidity(extractedTags);
  console.log("Tags are valid.");
} catch (error) {
  console.error(error.message);
}
