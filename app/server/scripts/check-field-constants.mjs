/**
 * This script checks if the field constants in the Java files are named and defined correctly.
 */

import {promises as fs} from "fs";
import path from "path";

async function findInnerClassDefinitions(directory) {
  let isPass = true;

  try {
    const files = await fs.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        if (!await findInnerClassDefinitions(filePath)) {
          isPass = false;
        }
      } else if (path.extname(filePath) === ".java") {
        if (!await processJavaFile(filePath)) {
          isPass = false;
        }
      }
    }
  } catch (err) {
    console.error(err);
    isPass = false;
  }

  return isPass;
}

async function processJavaFile(filePath) {
  let isPass = true;

  try {
    const contents = await fs.readFile(filePath, "utf8");

    const innerClassRegex = /^ {4}([\w ]+?)\s+class\s+Fields\s+(extends (\w+)\.Fields)?\s*{(.+?\n {4})?}$/gsm;

    for (const innerClassMatch of contents.matchAll(innerClassRegex)) {
      const classQualifiers = innerClassMatch[1]; // we don't care much about this
      const expectedParentClass = innerClassMatch[3];

      for (const match of innerClassMatch[0].matchAll(/\bpublic\s+static\s+final\s+String\s+(\w+)\s+=\s+(.+?);/gs)) {
        const key = match[1];
        const valMatcherParts = [`^dotted\\(`];
        for (const [i, field] of key.split("_").entries()) {
          if (i > 0) {
            valMatcherParts.push(`\\s*,\\s+`);
          }
          valMatcherParts.push(`(\\w+\\.\\w+\\.)?${field}`);
        }
        valMatcherParts.push(`\\s*\\)$`);
        const valMatcher = new RegExp(valMatcherParts.join(""));
        if (!valMatcher.test(match[2])) {
          console.log(filePath, classQualifiers, expectedParentClass);
          console.log("\tkey is", key);
          console.log("\tval is", match[2]);
          console.log("\tpattern", valMatcher);
          console.error(`\tField ${key} in ${filePath} is not looking right.`);
          isPass = false;
        }
      }
    }

    // if (finds.length > 1) {
    //   console.error(`Found multiple inner class definitions in file: ${filePath}`);
    //   return;
    // }

  } catch (err) {
    console.error(err);
    isPass = false;
  }

  return isPass;
}

// Can't use `import.meta.dirname` because it's not available in Node.js 18.
// And v18 is what is included in GitHub Actions today.
// See <https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2204-Readme.md#language-and-runtime>.
const directoryPath = import.meta.resolve("..").replace("file://", "");

findInnerClassDefinitions(directoryPath)
  .then(isPass => {
    if (isPass) {
      console.log("All okay.");
    } else {
      console.error("Some field constants are not looking good.");
      process.exitCode = 1;
    }
  });
