const fs = require("fs");
const path = require("path");

// Replace tag names with the actual tag values
const tag = {
  excludeForAirgap: "tag.excludeForAirgap",
  airgap: "tag.airgap",
  Git: "tag.Git",
  Widget: "tag.Widget",
  Multiselect: "tag.Multiselect",
  Slider: "tag.Slider",
  CurrencyInput: "tag.CurrencyInput",
  Text: "tag.Text",
  Statbox: "tag.Statbox",
  Modal: "tag.Modal",
  Filepicker: "tag.Filepicker",
  Select: "tag.Select",
  RichTextEditor: "tag.RichTextEditor",
  Switch: "tag.Switch",
  List: "tag.List",
  Button: "tag.Button",
  Divider: "tag.Divider",
  Audio: "tag.Audio",
  Table: "tag.Table",
  Image: "tag.Image",
  Tab: "tag.Tab",
  JSONForm: "tag.JSONForm",
  Binding: "tag.Binding",
  IDE: "tag.IDE",
  Datasource: "tag.Datasource",
  JS: "tag.JS",
  GenerateCRUD: "tag.GenerateCRUD",
  MobileResponsive: "tag.MobileResponsive",
  Theme: "tag.Theme",
  Random: "tag.Random",
  Admin: "tag.Admin",
};

// Function to convert tag strings to tag values
function convertTagsToTagValues(tags) {
  return tags.map((t) => tag[t]);
}

function addTagsToDescribeBlock(filePath, tags) {
  const fileContent = fs.readFileSync(filePath, "utf-8");

  const updatedContent = fileContent.replace(
    /describe\s*\(\s*("[^"]*")\s*,\s*function\s*\(\s*\)\s*{/g,
    (match, p1) => {
      const describeString = p1.replace(/"/g, ""); // Remove quotes from the first parameter
      if (tags.some((tag) => describeString.includes(tag))) {
        const tagValues = convertTagsToTagValues(tags);
        return `describe(${p1}, { tags: [${tagValues.join(
          ", ",
        )}] }, function () {`;
      }
      return match; // Return original match if no matching tag is found
    },
  );

  // Write updated content back to the file
  fs.writeFileSync(filePath, updatedContent, "utf-8");
}

// Function to iterate through files in a directory
function iterateFilesInFolder(folderPath, tags) {
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);

      // Check if the file is a .js or .ts file
      if (
        fs.statSync(filePath).isFile() &&
        (filePath.endsWith(".js") || filePath.endsWith(".ts"))
      ) {
        addTagsToDescribeBlock(filePath, tags);
        console.log(`Tags added to ${filePath}`);
      } else if (fs.statSync(filePath).isDirectory()) {
        // Recursively call for subdirectories
        iterateFilesInFolder(filePath, tags);
      }
    });
  });
}

// Read command line arguments for folderPath and tagsToAdd
const args = process.argv.slice(2);
if (args.length < 2) {
  console.error("Please provide both folder path and tags to add.");
  process.exit(1);
}

const folderPath = args[0];
const tagsToAdd = args.slice(1);

// Start iterating through files in the specified folder
iterateFilesInFolder(folderPath, tagsToAdd);
