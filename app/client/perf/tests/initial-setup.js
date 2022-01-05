const puppeteer = require("puppeteer");

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

(async () => {
  const browser = await puppeteer.launch({
    args: ["--window-size=1920,1080"],
    ignoreHTTPSErrors: true,
  });
  let page = await browser.newPage();
  await page.goto("https://dev.appsmith.com/setup/welcome");
  // await page.goto("http://localhost/setup/welcome");
  // Since we are not testing the initial setup, just send the post request directly.
  // Could be moved to bash script as well.
  await page.evaluate(async () => {
    const url = "https://dev.appsmith.com/api/v1/users/super";
    // const url = "http://localhost/api/v1/users/super";
    await fetch(url, {
      headers: {
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "en-US,en;q=0.9,fr-CA;q=0.8,fr;q=0.7",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded",
      },

      referrerPolicy: "strict-origin-when-cross-origin",
      body:
        "name=Im+Puppeteer&email=hello%40myemail.com&password=qwerty1234&allowCollectingAnonymousData=true&signupForNewsletter=true&role=engineer&useCase=just+exploring",
      method: "POST",
      mode: "cors",
      credentials: "include",
    })
      .then((res) =>
        console.log("Save page with new DSL response:", res.json()),
      )
      .catch((err) => {
        console.log("Save page with new DSL error:", err);
      });
  });
  console.log("Initial setup is successful");
  await browser.close();
})();
