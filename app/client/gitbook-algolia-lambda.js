const https = require("https");
const algoliasearch = require("algoliasearch");
const aws = require("aws-sdk");

const SSM = new aws.SSM();

const DOCS_VERSION = "v1.2.1";

const orderArr = [{
    path: "master/core-concepts/building-the-ui",
    order: 0,
}, {
    path: "master/core-concepts/connecting-to-databases",
    order: 1
}, {
    path: "master/core-concepts/apis",
    order: 2
}, {
    path: "master/core-concepts/connecting-ui-and-logic",
    order: 3
}, {
    path: "master/core-concepts/building-the-ui/calling-apis-from-widgets#sending-data-to-apis-queries",
    order: 4
}];

var options = {
  headers: {
    Authorization:
      "Bearer aEhCb3hxVzVYWFJCY0g4b1owZmdKcTdJUmc0MjotTTY5cHFwVDlxTWx0cFU2akh4MC0tTTY5cHFwVWFobjBaRWNzTjh0WA==",
    Cookie: "__cfduid=d8bac210f6e11cb26a8cd921f77727e3f1588323072",
  },
};

console.log("Loading function");


function getPage(pageId) {
  return new Promise((resolve, reject) => {
    const url = `https://api-beta.gitbook.com/v1/spaces/-Lzuzdhj8LjrQPaeyCxr/content/v/${DOCS_VERSION}/id/${pageId}?format=markdown`;
    console.log("Getting URL", url);
    https.get(url, options, (res) => {
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          resolve(parsedData);
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

  if (page === null) {
    throw new Error("Tried getting page " + retries + " times, but failed.");
  }

  return page;
}

const pages = {};


function pushChildPages(masterPage) {
  if (masterPage.pages) {
    masterPage.pages.forEach(page => {
      page.path = (masterPage.path || masterPage.ref) + "/" + page.path;
      pushChildPages(page);
      page.pages = undefined;
      pages[page.uid] = page;
    });
  }
}

function swap(arr, index1, index2) {
    let x = arr[index1];
    arr[index1] = arr[index2];
    arr[index2] = x;
}

async function getAllPages(pageIds) {
  const allPages = [];
  for (const pageId of pageIds) {
    allPages.push(await getPageRetry(pageId, 3));
  }
  return allPages;
}

exports.handler = async (event, context, callback) => {
  const parameters = await loadParametersFromStore("/" + process.env.ENV + "/algolia");
  console.log('Received event:', JSON.stringify(event, null, 2));

  const client = algoliasearch(parameters.application_id, parameters.api_key);
  const algoliaIndex = client.initIndex("test_appsmith");

  return await new Promise((resolve, reject) => {
    https.get("https://api-beta.gitbook.com/v1/spaces/-Lzuzdhj8LjrQPaeyCxr/content", options, (res) => {
      console.log("Setting up response handlers for GitBook API request");
      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          let requiredIndex = parsedData.variants.findIndex(varaint => varaint.uid === DOCS_VERSION);
          let masterPage = parsedData.variants[requiredIndex].page;

          pushChildPages(masterPage);
          delete masterPage.pages;

          pages[masterPage.uid] = masterPage;

          getAllPages(Object.keys(pages)).then(updatedPages => {

            updatedPages.forEach((page, index) => {
              page.path = pages[page.uid].path;
              delete page.pages;
              page.objectID = page.uid;
              delete page.uid;
              if(page.path.endsWith("/changelog")) {
                delete page.document;
              }
            });

            orderArr.forEach(order => {
                let index = updatedPages.findIndex(i => i.path === order.path);
                if(index !== -1) {
                    swap(updatedPages, index, order.order);
                }
            });

            updatedPages = updatedPages.map((item, index) => {return {...item, defaultOrder: index}});

            // Truncate large docs.
            updatedPages.filter(page => page.document).forEach(page => {
              const size = JSON.stringify(page).length;
              if (size < 10000) {
                return;
              }
              console.log("Truncating page", page);
              page.document = page.document.substr(0, page.document.length - (JSON.stringify(page).length - 9900));
            });//*/

            console.log("Pages (" + updatedPages.length + "):", updatedPages.map(page => ({objectID: page.objectID, size: JSON.stringify(page).length, title: page.title, path: page.path})));

            // resolve({
            //   statusCode: 200,
            //   body: JSON.stringify(updatedPages)
            // })

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
