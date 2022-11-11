const { Octokit } = require("octokit");
const { marked } = require("marked");
const algoliasearch = require("algoliasearch");
const aws = require("aws-sdk");

const SSM = new aws.SSM();
const octokit = new Octokit({
  auth: "github_pat_<token>",
});

// Utils
// Get markdown string from base64 format
const decodeBase64 = (data) => {
  return Buffer.from(data, "base64").toString("ascii");
};
// Reorder pages
const orderPages = (pages) => {
  const orderMap = {
    "learning-and-resources/sample-apps": 0,
    "core-concepts/connecting-to-data-sources/": 1,
    "core-concepts/data-access-and-binding/displaying-data-read/": 2,
    "core-concepts/data-access-and-binding/capturing-data-write/": 3,
    "core-concepts/writing-code/": 4,
    "help-and-support/troubleshooting-guide/": 5,
    "learning-and-resources/how-to-guides/": 6,
    "reference/appsmith-framework/": 7,
  };
  pages.sort((pageA, pageB) => {
    const orderA = orderMap[pageA.path] || 999;
    const orderB = orderMap[pageB.path] || 999;
    return orderB - orderA;
  });
  pages = pages.map((item, index) => {
    return { ...item, defaultOrder: index };
  });
  return pages;
};
// Fetch credentials
async function loadParametersFromStore(prefix) {
  const parametersResponse = await SSM.getParametersByPath({
    Path: prefix,
    WithDecryption: true,
  }).promise();

  const parameters = {};
  for (const paramObject of parametersResponse.Parameters) {
    parameters[paramObject.Name.replace(prefix + "/", "")] = paramObject.Value;
  }

  return parameters;
}

// Updates
// Update image urls
const updateImageUrls = (document) => {
  const prefix =
    "https://raw.githubusercontent.com/appsmithorg/appsmith-docs/main/website/static";
  // Regex matches image urls in the markdown
  document = document.replace(/(!\[.*?\]\()(.+?)(\))/g, function(
    match,
    openingBracket,
    url,
    closingBracket,
  ) {
    // We leave it is if it is an absolute url
    if (!url.startsWith("https:")) {
      return openingBracket + prefix + url + closingBracket;
    }
    return match;
  });
  return document;
};
// Update links
const updateLinks = (document, path) => {
  // Matches links in markdown
  const regexMdLinks = /(?<!\!)\[([^\[\]]*)\]\((.*?)\)/gm;
  const singleMatch = /(?<!\!)\[([^\[\]]*)\]\((.*?)\)/;
  const matches = document.match(regexMdLinks);
  // Get path without the file extension at the end.
  const pathWithoutExtension = path.replace(/[README]*\.[^/.]+$/, "");
  const isFileReadme = path.replace(/^.*[\\\/]/, "") === "README.md";

  if (!matches) return;
  matches.map((match) => {
    const text = singleMatch.exec(match);
    // Get just the link
    const parentPath = pathWithoutExtension
      .split("/")
      .slice(0, -1)
      .join("/");
    // link href without the text
    const link = text[2];
    if (link.startsWith("https:")) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_match, readme = "", extension = "", _hash] = link.match(
      /(README)*(\.[^#/.]+)(#.*)?/,
    ) ?? ["", "", "", ""];
    // Remove extensions from file.
    let formattedText = link.replace(readme + extension, "");
    // Get levels ../, ../../ etc.
    let levels = (formattedText.match(/\.\.\//g) || []).length;
    // Path for video/README.md is video/ at docs.appsmith.com
    if (!isFileReadme) {
      levels += 1;
    }
    // Get path after moving back levels ../../
    const pathAtLevel = pathWithoutExtension
      .split("/")
      .filter(Boolean)
      .slice(0, -levels)
      .join("/");
    // Replace path levels ../../ etc with ""
    formattedText = formattedText.replace(/\.\.\//g, "");
    // If path starts from root ignore as the path is correct as it is
    if (!link.startsWith("/")) {
      if (levels) {
        formattedText = `${pathAtLevel}/${formattedText}`;
      } else {
        formattedText = `${parentPath}/${formattedText}`;
      }
    }
    document = document.replace(`(${link})`, `(${formattedText})`);
  });
  return document;
};

// Extracts
// Get the h1 text
const getTitle = (document) => {
  let title = "";
  marked.use({
    walkTokens: (token) => {
      if (token.type === "heading" && token.depth === 1) {
        title = token.text;
      }
    },
  });
  marked.parse(document);
  return title;
};
// Get path
const getPath = (fullPath) => {
  return fullPath.replace(/[README]*\.[^/.]+$/, "");
};

// Core
// Parse each file under the docs folder
async function parseFile(file) {
  try {
    const fullPath = file.path;
    // Get info about the file
    const response = await octokit.request(
      `GET /repos/appsmithorg/appsmith-docs/contents/website/docs/${fullPath}`,
    );
    // Markdown
    let document = decodeBase64(response.data.content);

    // Extract the heading of the markdown and assign it to title
    const title = getTitle(document);
    // Get docs path
    const path = getPath(fullPath);
    // Update image urls
    document = updateImageUrls(document);
    // Update links
    document = updateLinks(document, fullPath);
    if (response.data.content) {
      // Content of each record in the index
      return {
        title,
        document,
        kind: "document",
        path,
      };
    }
  } catch (e) {
    console.log(e);
  }
}
// Fetch all files under docs folder
async function fetchMarkdownFiles() {
  try {
    // Get sha's of the immediate files unders website.
    const basePaths = await octokit.request(
      "GET /repos/appsmithorg/appsmith-docs/contents/website",
    );
    // Just get info about the docs/ folder
    const docsPath = basePaths.data.find((path) => path.name === "docs");
    // Get all files recursively under docs/ folder
    const files = await octokit.request(
      `GET /repos/appsmithorg/appsmith-docs/git/trees/${docsPath.sha}?recursive=true`,
    );
    let finalIndex = await Promise.all(
      files.data.tree.map(async (file) => {
        // Skip folders
        if (file.type !== "tree") {
          return await parseFile(file);
        }
      }),
    );
    finalIndex = finalIndex.flat().filter(Boolean);
    // Sort/order the pages
    finalIndex = orderPages(finalIndex);
    return finalIndex;
  } catch (e) {
    console.log(e);
  }
}

async function main() {
  try {
    const parameters = await loadParametersFromStore(
      "/" + process.env.ENV + "/algolia",
    );
    const client = algoliasearch(parameters.application_id, parameters.api_key);
    const algoliaIndex = client.initIndex("omnibar_docusaurus_index");
    const finalIndex = await fetchMarkdownFiles();
    // Upload the aggregated data to algolia
    await algoliaIndex.replaceAllObjects(finalIndex, {
      autoGenerateObjectIDIfNotExist: true,
    });
  } catch (e) {
    console.log(e);
  }
}

main();
