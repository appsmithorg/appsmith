const fs = require('fs');
const { Tag } = require('./tags');

function extractTagsFromTestFile(filePath) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Regular expression to match the describe block and extract the tags
  const describeBlockRegex = /describe\s*\(\s*["'`](.*?)["'`]\s*,\s*({[\s\S]*?})\s*,\s*[\s\S]*?\)/g;
  const matches = describeBlockRegex.exec(fileContent);

  if (matches && matches.length >= 3) {
    const tagsObj = eval(`(${matches[2]})`); // Parse the tags object
    if (tagsObj.tags && Array.isArray(tagsObj.tags)) {
      return { filePath, tags: tagsObj.tags };
    }
  }
  return { filePath, tags: [] };
}

function checkTagsValidity(fileInfo) {
  const invalidTags = fileInfo.tags.filter(tag => !Tag.includes(tag));
  if (invalidTags.length > 0) {
    return { filePath: fileInfo.filePath, invalidTags };
  }
  return null;
}

// Extract tags from the test files passed as command-line arguments
const fileInfos = process.argv.slice(2).map(filePath => extractTagsFromTestFile(filePath));

// Check validity for each file
fileInfos.forEach(fileInfo => {
  const error = checkTagsValidity(fileInfo);
  if (error) {
    console.error(`Invalid tag(s) found in ${error.filePath}: ${error.invalidTags.join(', ')}. Refer to tag.js for allowed tags.`);
  } else {
    console.log(`Tags in ${fileInfo.filePath} are valid.`);
  }
});
