import {promises as fs} from "fs";
import path from "path";

async function findInnerClassDefinitions(directory) {
  try {
    const files = await fs.readdir(directory);

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);

      if (stats.isDirectory()) {
        await findInnerClassDefinitions(filePath);
      } else if (path.extname(filePath) === '.java') {
        await processJavaFile(filePath);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function processJavaFile(filePath) {
  try {
    const contents = await fs.readFile(filePath, 'utf8');

    const innerClassRegex = /^ {4}([\w ]+?)\s+class\s+Fields\s+(extends (\w+)\.Fields)?\s*{(.+?\n {4})?}$/gsm;

    for (const innerClassMatch of contents.matchAll(innerClassRegex)) {
      const classQualifiers = innerClassMatch[1]; // we don't care much about this
      const expectedParentClass = innerClassMatch[3];
      console.log(filePath, classQualifiers, expectedParentClass);

      for (const match of innerClassMatch[0].matchAll(/\bpublic\s+static\s+final\s+String\s+(\w+)\s+=\s+(.+?);/gs)) {
        const key = match[1]
        const valMatcherParts = [`^dotted\\(`];
        for (const [i, field] of key.split("_").entries()) {
          if (i > 0) {
            valMatcherParts.push(`\\s*,\\s+`);
          }
          valMatcherParts.push(`(\\w+\\.\\w+\\.)?${field}`);
        }
        valMatcherParts.push(`\\s*\\)$`);
        const valMatcher = new RegExp(valMatcherParts.join(''));
        if (!valMatcher.test(match[2])) {
          console.log("key is", key);
          console.log("val is", match[2]);
          console.log("pattern", valMatcher);
          console.error(`Field ${key} in ${filePath} is not looking right.`);
        }
      }
    }

    // if (finds.length > 1) {
    //   console.error(`Found multiple inner class definitions in file: ${filePath}`);
    //   return;
    // }

  } catch (err) {
    console.error(err);
  }
}

const directoryPath = '.';
findInnerClassDefinitions(directoryPath);
