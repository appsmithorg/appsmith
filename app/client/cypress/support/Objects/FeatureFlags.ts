import type {
  CyHttpMessages,
  HttpResponseInterceptor,
} from "cypress/types/net-stubbing";
import { LICENSE_FEATURE_FLAGS } from "../Constants";
import { ObjectsRegistry } from "./Registry";

const defaultFlags = {
  rollout_remove_feature_walkthrough_enabled: false, // remove this flag from here when it's removed from code
  release_git_modularisation_enabled: true,
  release_git_api_contracts_enabled: true,
  license_static_url_enabled: true,
};

// Sends an intercepted request upstream, skips earlier handlers on the same
// route, and lets `handler` rewrite the response. The handler is registered
// with req.on("response") because Cypress fails the running test when a
// request that carries a req.reply(callback) or req.continue(callback) handler
// is aborted mid-response, which cy.visit, cy.reload and in-app navigation do
// to any request still in flight.
export const rewriteUpstreamResponse = (
  req: CyHttpMessages.IncomingHttpRequest,
  handler: HttpResponseInterceptor,
) => {
  req.on("response", handler);
  req.continue();
};

export const featureFlagIntercept = (
  flags: Record<string, boolean> = {},
  reload = true,
  // When true, the requested flags are OVERLAID on the real feature flags from the
  // backend instead of REPLACING them. The replace behavior drops every flag the test
  // didn't list — including editor-infrastructure flags (e.g. release_app_sidebar_enabled)
  // that the IDE needs to render at all. Tests that open the full editor (Anvil/AI) must
  // preserve those, or the editor never mounts (.t--sidebar-Editor never appears).
  preserveOtherFlags = false,
) => {
  getConsolidatedDataApi(
    { ...flags, ...defaultFlags },
    false,
    preserveOtherFlags,
  );
  if (preserveOtherFlags) {
    cy.intercept("GET", "/api/v1/users/features", (req) => {
      rewriteUpstreamResponse(req, (res: any) => {
        const original = res?.body?.data ?? {};
        res.send({
          responseMeta: { status: 200, success: true },
          data: { ...original, ...flags, ...defaultFlags },
          errorDisplay: "",
        });
      });
    });
  } else {
    const response = {
      responseMeta: {
        status: 200,
        success: true,
      },
      data: {
        ...flags,
        ...defaultFlags,
      },
      errorDisplay: "",
    };
    cy.intercept("GET", "/api/v1/users/features", response);
  }
  if (reload) ObjectsRegistry.AggregateHelper.CypressReload();
};

export const getConsolidatedDataApi = (
  flags: Record<string, boolean> = {},
  reload = true,
  preserveOtherFlags = false,
) => {
  cy.intercept("GET", "/api/v1/consolidated-api/*?*", (req) => {
    delete req.headers["if-none-match"];
    rewriteUpstreamResponse(req, (res: any) => {
      if (
        res.statusCode === 200 ||
        res.statusCode === 401 ||
        res.statusCode === 500
      ) {
        const originalResponse = res?.body;
        try {
          const updatedResponse = JSON.parse(JSON.stringify(originalResponse));
          updatedResponse.data.featureFlags.data = preserveOtherFlags
            ? { ...updatedResponse.data.featureFlags.data, ...flags }
            : { ...flags };
          return res.send(updatedResponse);
        } catch (e) {
          // This runs inside a cy.intercept response handler, which is outside
          // the Cypress command queue. Enqueuing a cy.* command here makes
          // Cypress throw "returned a promise from a command while also invoking
          // one or more cy commands", failing whichever hook or test the
          // intercept fired under. Log outside the queue instead.
          console.log("FeatureFlags.ts: consolidated-api rewrite failed", e);
        }
      }
    });
  }).as("getConsolidatedData");
  if (reload) ObjectsRegistry.AggregateHelper.CypressReload();
};

export const featureFlagInterceptForLicenseFlags = () => {
  cy.intercept(
    {
      method: "GET",
      url: "/api/v1/users/features",
    },
    (req) => {
      rewriteUpstreamResponse(req, (res) => {
        if (res) {
          const originalResponse = res.body;
          let modifiedResponse: any = {};
          Object.keys(originalResponse.data).forEach((flag) => {
            if (LICENSE_FEATURE_FLAGS.includes(flag)) {
              modifiedResponse[flag] = originalResponse.data[flag];
            }
          });
          modifiedResponse = {
            ...modifiedResponse,
            release_app_sidebar_enabled: true,
          };
          res.send({
            responseMeta: {
              status: 200,
              success: true,
            },
            data: { ...modifiedResponse },
            errorDisplay: "",
          });
        }
      });
    },
  ).as("getLicenseFeatures");

  cy.intercept("GET", "/api/v1/consolidated-api/*?*", (req) => {
    rewriteUpstreamResponse(req, (res: any) => {
      delete req.headers["if-none-match"];
      if (res.statusCode === 200) {
        const originalResponse = res?.body;
        const updatedResponse = JSON.parse(JSON.stringify(originalResponse));
        updatedResponse.data.featureFlags.data = {};
        Object.keys(originalResponse.data.featureFlags.data).forEach((flag) => {
          if (LICENSE_FEATURE_FLAGS.includes(flag)) {
            updatedResponse.data.featureFlags.data[flag] =
              originalResponse.data.featureFlags.data[flag];
          }
        });
        updatedResponse.data.featureFlags.data["release_app_sidebar_enabled"] =
          true;
        return res.send(updatedResponse);
      }
    });
  }).as("getConsolidatedData");

  ObjectsRegistry.AggregateHelper.CypressReload();
};
