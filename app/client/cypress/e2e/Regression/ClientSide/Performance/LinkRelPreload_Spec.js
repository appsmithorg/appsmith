import * as _ from "../../../../support/Objects/ObjectsCore";
import emptyDSL from "../../../../fixtures/emptyDSL.json";
import { AppSidebar } from "../../../../support/Pages/EditorNavigation";

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

describe(
  "html should include preload metadata for all code-split javascript",
  { tags: ["@tag.IDE"] },
  function () {
    before(() => {
      cy.addDsl(emptyDSL);
    });

    it("1. In edit mode", function () {
      testPreloadMetadata("edit-mode");
    });

    // Note: this must be a separate test from the previous one,
    // as we’re relying on Cypress resetting intercepts between tests.
    it("2. In view mode", function () {
      reloadAndTogglePreloading(true);

      // Ensure the app editor is fully loaded
      AppSidebar.assertVisible();

      _.deployMode.DeployApp();

      testPreloadMetadata("view-mode");
    });
  },
);

function testPreloadMetadata(viewOrEditMode) {
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
    // Don’t collect:
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
    jsRequests.push(new URL(req.url).pathname);
  }).as("jsRequests");

  // Make all web workers empty. This prevents web workers from loading additional chunks,
  // as we need to collect only chunks from the main thread
  cy.intercept(/\/static\/js\/.+Worker\..+\.js/, { body: "" }).as("worker");

  // Reload without preloading, as we want to collect only chunks
  // actually requested by the current route
  reloadAndTogglePreloading(false);

  cy.waitForNetworkIdle("/static/js/*.js", 5000, { timeout: 60 * 1000 });

  cy.window().then((window) => {
    // If this line fails, then we failed to intercept any JS requests for some reason
    expect(jsRequests).to.not.be.empty;

    if (!window.__APPSMITH_CHUNKS_TO_PRELOAD) {
      throw new Error("window.__APPSMITH_CHUNKS_TO_PRELOAD is not defined");
    }
    if (!window.__APPSMITH_CHUNKS_TO_PRELOAD[viewOrEditMode]) {
      throw new Error(
        `window.__APPSMITH_CHUNKS_TO_PRELOAD['${viewOrEditMode}'] is not defined`,
      );
    }
    const links = window.__APPSMITH_CHUNKS_TO_PRELOAD[viewOrEditMode].map(
      (link) => (window.CDN_URL ?? "/") + link,
    );

    const allRequestsDuringPageLoad = unique(
      jsRequests.filter(
        (link) =>
          // Exclude link bundle requests. We don’t really care about being precise
          //  with their preloading, as icons aren’t critical for the first paint
          !link.includes("-icons."),
      ),
    );
    const preloadLinks = unique(
      links.filter(
        (link) =>
          // Exclude link bundle preloads. We don’t really care about being precise
          //  with their preloading, as icons aren’t critical for the first paint
          !link.includes("-icons.") &&
          // Exclude css preloads. We’re only intercepting JS requests so can only
          // compare them
          !link.endsWith(".css"),
      ),
    );

    // check if req
    const isSubset = preloadLinks.every(item => allRequestsDuringPageLoad.includes(item));
    expect(isSubset).to.be.true; 
  });
}

/** Removes all duplicated items from the array */
function unique(arr) {
  return Array.from(new Set(arr));
}

function reloadAndTogglePreloading(chunkPreloadingEnabled) {
  cy.url().then((currentURL) => {
    let url = new URL(currentURL);
    if (chunkPreloadingEnabled) {
      url.searchParams.set("disableChunkPreload", "true");
    } else {
      url.searchParams.delete("disableChunkPreload");
    }
    cy.visit(url.toString());
  });
}
