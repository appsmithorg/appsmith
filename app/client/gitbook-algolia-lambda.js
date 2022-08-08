const https = require("https");
const algoliasearch = require("algoliasearch");
const aws = require("aws-sdk");

const SSM = new aws.SSM();

const SPACE_ID = "-Lzuzdhj8LjrQPaeyCxr-3757176148";

const orderMap = {
    "sample-apps": 0,
    "core-concepts/connecting-to-data-sources": 1,
    "core-concepts/displaying-data-read": 2,
    "core-concepts/capturing-data-write": 3,
    "core-concepts/writing-code": 4,
    "troubleshooting-guide": 5,
    "how-to-guides": 6,
    "framework-reference/cheat-sheet": 7
};

var options = {
  headers: {
    Authorization:
      "Bearer -M69pqpT9qMltpU6jHx0--M69pqpUahn0ZEcsN8tX",
    Cookie: "__cfduid=d8bac210f6e11cb26a8cd921f77727e3f1588323072",
  },
};

console.log("Loading function");


function getPage(pageId) {
  return new Promise((resolve, reject) => {
    const url = `https://api.gitbook.com/v1/spaces/${SPACE_ID}/content/page/${pageId}?format=markdown`;
    console.log("Getting URL", url);
    https.get(url, options, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
          console.log("fetched page " + pageId);
        } catch (e) {
          console.error(e.message);
          console.error("Full response body:", rawData);
          reject(e);
        }
      });
    });
  });
}

async function getPageRetry(pageId, retries) {
  let page = null;

  while (retries-- > 0) {
    try {
      console.log("Retries left", pageId, retries);
      page = await getPage(pageId);
      break;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      continue;
    }
  }

  if (page == null) {
    throw new Error("Tried getting page " + retries + " times, but failed.");
  }

  return page;
}

const pages = {};


function pushChildPages(masterPage) {
  if (masterPage.pages) {
    masterPage.pages.forEach(page => {
      pushChildPages(page);
      page.pages = undefined;
      pages[page.id] = page;
    });
  }
}

async function getAllPages(pageIds) {
  const allPages = [];
  for (const pageId of pageIds) {
    allPages.push(getPageRetry(pageId, 3));
  }
  return Promise.all(allPages);
}

function extractLinkMatches(markdown) {
  const regex =  /\[(.*?)\]\((.*?)\)/g;
  const matches = markdown.matchAll(regex);
  return [...matches];
}

function getAbsoluteLink(link, currentPageFullPath) {
  console.log("page path ", currentPageFullPath);
  console.log("relative link ", link);
  const linkPaths = link.split("/");
  const pagePaths = currentPageFullPath.split("/");
  let pathIndex = pagePaths.length > 1 ? (pagePaths.length - 1) : 0;
  linkPaths.map((path, index) => {
    if (path === "..") {
      pagePaths[pathIndex] = undefined;
      pathIndex -= 1;
    }
  });
  let absoluteLink = pagePaths.filter((path) => path !== undefined).join("/");
  if (absoluteLink.length > 0) {
    absoluteLink += "/";
  }
  absoluteLink += linkPaths.filter((path) => path !== "..").join("/");
  console.log("absolute link ", absoluteLink);
  return absoluteLink;
}

exports.handler = async (event, context, callback) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const parameters = await loadParametersFromStore("/" + process.env.ENV + "/algolia");
  const client = algoliasearch(parameters.application_id, parameters.api_key);
  const algoliaIndex = client.initIndex("test_appsmith");

  return await new Promise((resolve, reject) => {
    https.get(`https://api.gitbook.com/v1/spaces/${SPACE_ID}/content`, options, (res) => {
      console.log("Setting up response handlers for GitBook API request");
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          let masterPage = parsedData;

          pushChildPages(masterPage);
          delete masterPage.pages;

          getAllPages(Object.keys(pages)).then(updatedPages => {
            // console.log("fetched all pages ", Object.keys(pages));
            updatedPages.forEach((page, index) => {
              // console.log("update page fullpath", page.id);
              page.path = pages[page.id].path;
              delete page.pages;
              page.objectID = page.id;
              delete page.id;
            });
            updatedPages.sort((pageA, pageB) => {
              const orderA = orderMap[pageA.path] || 999;
              const orderB = orderMap[pageB.path] || 999;
              return orderB - orderA;
            });
            console.log("sorted pages")
            updatedPages = updatedPages.map((item, index) => {return {...item, defaultOrder: index}});

            // Truncate large docs, marking few docs as default and changing the markdown key for backward compatibility
            updatedPages.filter(page => page.markdown)
              .forEach(page => {
                if (page.markdown) {
                  const size = JSON.stringify(page).length;
                  if (size > 10000) {
                    page.markdown = page.markdown.slice(0, -(size - 9900));
                  }
                  if (orderMap[page.path]) {
                    page.isDefault = true;
                  }
                  const matches = extractLinkMatches(page.markdown);
                  matches.map((match) => {
                    const link = match[2];
                    if (!link.startsWith('https:')) {
                      const absoluteLink = getAbsoluteLink(link, page.path);
                      console.log('replace', match[0], match[0].replace("(" + link + ")", "(" + absoluteLink + ")"));
                      page.markdown = page.markdown.replace(match[0], match[0].replace("(" + link + ")", "(" + absoluteLink + ")"));
                    }
                  });
                  page.document = page.markdown;
                  page.markdown = undefined;
                  page.kind = "document";
                }
            });//*/

            console.log("Pages:", updatedPages.map(page => ({objectID: page.objectID, size: JSON.stringify(page).length, title: page.title, path: page.path})));

            // resolve({
            //   statusCode: 200,
            //   body: JSON.stringify(updatedPages)
            // })
            if (updatedPages.length < 5) {
              reject({
                statusCode: 304,
                body: 'No content to update'
              });
            } else {
              algoliaIndex.replaceAllObjects(updatedPages, {
                autoGenerateObjectIDIfNotExist: true
              }).then(({ objectIDs }) => {
                console.log("Algolia upload finished", objectIDs);
                callback(null, 'Finished');
                resolve({
                  statusCode: 200,
                  body: JSON.stringify(updatedPages)
                });
              }).catch(e => {
                console.error("Algolia upload failed", e);
                reject({
                  statusCode: 500,
                  body: 'Algolia upload failed.'
                });
              });
            }
          });
        } catch (e) {
          reject({
              statusCode: 500,
              body: 'Most probably gitbook getPage apis failed'
          });
        }
      });
    }).on("error", (e) => {
      console.error(e);
      reject({
        statusCode: 500,
        body: "Error executing GitBook API request",
        error: e
      });
    });
  });

};

async function loadParametersFromStore(prefix) {
  const parametersResponse = await SSM.getParametersByPath({Path: prefix, WithDecryption: true}).promise();
  console.log("parametersResponse", parametersResponse);

  const parameters = {};
  for (const paramObject of parametersResponse.Parameters) {
    parameters[paramObject.Name.replace(prefix + "/", "")] = paramObject.Value;
  }

  console.log("Parameters", parameters);
  return parameters;
}
