import emptyDSL from "../../../../fixtures/emptyDSL.json";

// Hi, developer!
//
// To make Appsmith load faster, we code-split away some routes. (For example, if a user visits
// the view mode, it doesn’t need to load code for the edit mode, right?)
//
// This works very well to reduce the bundle size. However, it also makes some routes load slower.
// E.g., when you open an edit mode link (like https://dev.appsmith.com/app/142f9a81/page1-6424e6eafeaa7e0199eb1938/edit),
// edit mode chunks don’t start loading until the main bundle loads. This creates a network waterfall:
//   [main bundle]
//                [edit mode chunk 1]
//                [edit mode chunk 2]
//                [edit mode chunk 3]
//                                   [app is rendered]
//
// To avoid the waterfall, we emit <link rel="preload"> tags for all code-split chunks that
// an empty editor or an empty published app loads. This turns the above waterfall into this:
//   [main bundle]
//   [edit mode chunk 1]
//   [edit mode chunk 2]
//   [edit mode chunk 3]
//                      [app is rendered]
//
// This test exists to ensure that all code-split chunks are <link rel="preload">ed. If this test
// started failing for you, it’s likely you import()ed some new chunks that the edit or the view mode uses.
// To fix the test, see preloading instructions in public/index.html.

describe("html should include <link rel='preload'>s for all code-split javascript", function () {
  before(() => {
    cy.addDsl(emptyDSL);
  });

  it("1. In edit & View mode", function () {
    testLinkRelPreloads("edit-mode");
    //In view mode", function () {
    cy.PublishtheApp();

    testLinkRelPreloads("view-mode");
  });
});

function testLinkRelPreloads(viewOrEditMode) {
  // Disable network caching in Chromium, per https://docs.cypress.io/api/commands/intercept#cyintercept-and-request-caching
  // and https://github.com/cypress-io/cypress/issues/14459#issuecomment-768616195
  Cypress.automation("remote:debugger:protocol", {
    command: "Network.enable",
    params: {},
  });
  Cypress.automation("remote:debugger:protocol", {
    command: "Network.setCacheDisabled",
    params: { cacheDisabled: true },
  });

  const jsRequests = [];

  // Intercept all JS network requests and collect them
  cy.intercept(/\/static\/js\/.+\.js/, (req) => {
    // Ignore
    // - requests to worker files
    // - requests to icons
    // - request to the main bundle
    // as those aren’t <link rel="preload">ed by design
    if (
      req.url.includes("Worker.") ||
      req.url.includes("/icon.") ||
      req.url.includes("/main.")
    ) {
      return;
    }
    jsRequests.push(req.url);
  }).as("jsRequests");

  // Make all web workers empty. This prevents web workers from loading additional chunks,
  // as we need to collect only chunks from the main thread
  cy.intercept(/\/static\/js\/.+Worker\..+\.js/, { body: "" }).as(
    "workerRequests",
  );

  cy.reload();

  cy.waitForNetworkIdle("/static/js/*.js", 5000, { timeout: 60 * 1000 });

  cy.window().then((window) => {
    // If this line fails, then we failed to intercept any JS requests for some reason
    expect(jsRequests).to.not.be.empty;

    const links = window.__APPSMITH_CHUNKS_TO_PRELOAD[viewOrEditMode] || [];

    const uniqueRequests = [...new Set(jsRequests)];
    const requestsString = `[${uniqueRequests.length} items] ${uniqueRequests
      .sort()
      .join(", ")}`;

    const uniqueLinks = [...new Set(links)];
    const linksString = `[${uniqueLinks.length} items] ${uniqueLinks
      .sort()
      .join(", ")}`;

    // Comparing strings instead of deep-qualling arrays because this is the only way
    // to see which chunks are actually missing: https://github.com/cypress-io/cypress/issues/4084
    cy.wrap(requestsString).should("equal", linksString);
  });
}
