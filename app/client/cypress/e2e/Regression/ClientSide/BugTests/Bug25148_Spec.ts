import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, apiPage, dataSources } = _;
let dsName: any;

describe("Bug 25148 - Edit Datasource button was disabled on Authentication tab of Api action", () => {
  it("1. Checking if the Edit datasource button is enabled or not", () => {
    dataSources.NavigateToDSCreateNew();
    agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      dsName = "AuthAPI " + uid;
      dataSources.CreatePlugIn("Authenticated API");
      agHelper.RenameWithInPane(dsName, false);
      dataSources.FillAuthAPIUrl();
      dataSources.SaveDatasource();
      apiPage.CreateApi("API" + uid, "GET", true);
      apiPage.SelectPaneTab("Authentication");
      cy.get(apiPage._saveAsDS).should("be.enabled");
    });
  });
});
