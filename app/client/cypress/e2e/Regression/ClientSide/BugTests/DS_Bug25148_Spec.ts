import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, apiPage, dataSources } = _;
let dsName: any;

describe(
  "Bug 25148 - Edit Datasource button was disabled on Authentication tab of Api action",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  () => {
    it("1. Checking if the Edit datasource button is enabled or not", () => {
      dataSources.NavigateToDSCreateNew();
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dsName = "AuthAPI " + uid;
        dataSources.CreatePlugIn("Authenticated API");
        agHelper.RenameDatasource(dsName);
        dataSources.FillAuthAPIUrl();
        dataSources.SaveDatasource();
        apiPage.CreateApi("API" + uid, "GET", true);
        agHelper.AssertElementAbsence(apiPage._saveAsDS);
        apiPage.SelectPaneTab("Authentication");
        // Last one if present on the authentication tab.
        agHelper.AssertElementEnabledDisabled(apiPage._saveAsDS, 0, false);
      });
    });
  },
);
