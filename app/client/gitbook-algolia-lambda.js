var https = require("https");
const algoliasearch = require("algoliasearch");

const client = algoliasearch("AZ2Z9CJSJ0", "e92300d4e8dbaf2cbaa9ebbbeb4e06e6");
const index = client.initIndex("test_appsmith");

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
    https.get(
      `https://api-beta.gitbook.com/v1/spaces/-Lzuzdhj8LjrQPaeyCxr/content/v/master/id/${pageId}?format=markdown`,
      options,
      res => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", chunk => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (e) {
            reject(e);
            console.error(e.message);
          }
        });
      },
    );
  });
}

const pages = [];

function pushChildPages(masterPage) {
  if (masterPage.pages) {
    masterPage.pages.forEach(page => {
      page.path = masterPage.path + "/" + page.path;
      pushChildPages(page);
      page.pages = undefined;
      pages.push(page);
    });
  }
}

exports.handler = async event => {
  const response = await new Promise((resolve, reject) => {
    const req = https.get(
      "https://api-beta.gitbook.com/v1/spaces/-Lzuzdhj8LjrQPaeyCxr/content",
      options,
      res => {
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", chunk => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);

            let masterPage = parsedData.variants[0].page;

            pushChildPages(masterPage);
            masterPage.pages = undefined;

            pages.push(masterPage);

            let promises = pages.map(page => page.uid).map(getPage);
            Promise.all(promises).then(updatedPages => {
              updatedPages.forEach((page, index) => {
                page.path = pages[index].path;
                page.pages = undefined;
                page.objectID = page.uid;
              });

              resolve({
                statusCode: 200,
                body: JSON.stringify(updatedPages),
              });

              // index.replaceAllObjects(updatedPages, {
              //   autoGenerateObjectIDIfNotExist: true
              // }).then(({ objectIDs }) => {
              //   console.log(objectIDs);
              //   resolve({
              //     statusCode: 200,
              //     body: JSON.stringify(updatedPages)
              //   })
              // }).catch(e => {
              //   reject({
              //     statusCode: 500,
              //     body: 'Algolia upload failed.'
              //   })
              // })
            });
          } catch (e) {
            reject({
              statusCode: 500,
              body: "Most probably gitbook getPage apis failed",
            });
          }
        });
      },
    );
  });

  return response;
};
