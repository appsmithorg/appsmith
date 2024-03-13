import { LICENSE_FEATURE_FLAGS } from "../Constants";
import { ObjectsRegistry } from "./Registry";
import produce from "immer";

export const featureFlagIntercept = (
  flags: Record<string, boolean> = {},
  reload = true,
) => {
  getConsolidatedDataApi(flags, false);
  const response = {
    responseMeta: {
      status: 200,
      success: true,
    },
    data: {
      ...flags,
      release_show_new_sidebar_pages_pane_enabled: true,
      rollout_consolidated_page_load_fetch_enabled: true,
      release_side_by_side_ide_enabled: true,
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
    req.reply((res: any) => {
      if (
        res.statusCode === 200 ||
        res.statusCode === 401 ||
        res.statusCode === 500
      ) {
        const originalResponse = res?.body;
        const updatedResponse = produce(originalResponse, (draft: any) => {
          draft.data.featureFlags.data = { ...flags };
          draft.data.featureFlags.data["release_app_sidebar_enabled"] = true;
          draft.data.featureFlags.data[
            "release_show_new_sidebar_pages_pane_enabled"
          ] = true;
          draft.data.featureFlags.data[
            "rollout_consolidated_page_load_fetch_enabled"
          ] = true;
        });
        return res.send(updatedResponse);
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
            rollout_consolidated_page_load_fetch_enabled: true,
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
      if (res.statusCode === 200) {
        const originalResponse = res?.body;
        const updatedResponse = produce(originalResponse, (draft: any) => {
          draft.data.featureFlags.data = {};
          Object.keys(originalResponse.data.featureFlags.data).forEach(
            (flag) => {
              if (LICENSE_FEATURE_FLAGS.includes(flag)) {
                draft.data.featureFlags.data[flag] =
                  originalResponse.data.featureFlags.data[flag];
              }
            },
          );
          draft.data.featureFlags.data["release_app_sidebar_enabled"] = true;
          draft.data.featureFlags.data[
            "rollout_consolidated_page_load_fetch_enabled"
          ] = true;
        });
        return res.send(updatedResponse);
      }
    });
  }).as("getConsolidatedData");

  ObjectsRegistry.AggregateHelper.CypressReload();
};
