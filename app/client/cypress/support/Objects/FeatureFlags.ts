import { LICENSE_FEATURE_FLAGS } from "../Constants";
import { ObjectsRegistry } from "./Registry";

const defaultFlags = {
  rollout_remove_feature_walkthrough_enabled: false, // remove this flag from here when it's removed from code
  release_git_modularisation_enabled: true,
};

export const featureFlagIntercept = (
  flags: Record<string, boolean> = {},
  reload = true,
) => {
  getConsolidatedDataApi({ ...flags, ...defaultFlags }, false);
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
  if (reload) ObjectsRegistry.AggregateHelper.CypressReload();
};

export const getConsolidatedDataApi = (
  flags: Record<string, boolean> = {},
  reload = true,
) => {
  cy.intercept("GET", "/api/v1/consolidated-api/*?*", (req) => {
    delete req.headers["if-none-match"];
    req.reply((res: any) => {
      if (
        res.statusCode === 200 ||
        res.statusCode === 401 ||
        res.statusCode === 500
      ) {
        const originalResponse = res?.body;
        try {
          const updatedResponse = JSON.parse(JSON.stringify(originalResponse));
          updatedResponse.data.featureFlags.data = { ...flags };
          return res.send(updatedResponse);
        } catch (e) {
          cy.log(`Featureflags.ts error `, e);
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
      req.reply((res) => {
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
    req.reply((res: any) => {
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
