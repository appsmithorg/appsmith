import { LICENSE_FEATURE_FLAGS } from "../Constants";
import produce from "immer";
export const featureFlagIntercept = (
  flags: Record<string, boolean> = {},
  reload = true,
) => {
  const response = {
    responseMeta: {
      status: 200,
      success: true,
    },
    data: {
      ...flags,
      release_app_sidebar_enabled: true,
      rollout_consolidated_page_load_fetch_enabled:false,
    },
    errorDisplay: "",
  };
  cy.intercept("GET", "/api/v1/users/features", response);


  cy.intercept("GET", "/api/v1/consolidated-api?*", (req) => {
    req.reply((res:any) => {
      if (res) {
        const originalResponse = res.body;
        if (originalResponse?.data?.featureFlags?.data) {
          const updatedResponse = produce(originalResponse, (draft: any) => {
            draft.data.featureFlags.data = { ...draft.data.featureFlags.data, ...flags };
            draft.data.featureFlags.data["release_app_sidebar_enabled"] = true;
            draft.data.featureFlags.data["rollout_consolidated_page_load_fetch_enabled"] = false;
          })
          return res.send(updatedResponse);
        }
      }
    });
  }).as("getConsolidatedData");

  if (reload) {
    cy.reload();
    cy.wait(2000); //for the page to re-load finish for CI runs
  }
};
