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
    },
    errorDisplay: "",
  };
  cy.intercept("GET", "/api/v1/users/features", response);


  cy.intercept("GET", "/api/v1/consolidated-api?*", (req) => {
    req.reply((res:any) => {
      if (res) {
        const originalResponse = res.body;
        if (originalResponse?.data?.v1UsersFeaturesResp?.data) {
          const updatedResponse = produce(res, (draft:any) => {
            draft.body.data.v1UsersFeaturesResp.data["release_app_sidebar_enabled"] = true;
          })
      
          return updatedResponse;
        }
        return res
      }
    });
  }).as("getConsolidatedData");

  if (reload) {
    cy.reload();
    cy.wait(2000); //for the page to re-load finish for CI runs
  }
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
  cy.reload();
  cy.wait(2000); //for the page to re-load finish for CI runs
};
