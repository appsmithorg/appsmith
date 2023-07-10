import * as _ from "../../../../support/Objects/ObjectsCore";

const { agHelper, apiPage, dataSources } = _;
let dsName: any;

describe("Bug 6732 - this.params in IIFE function in API editor", () => {
  it("1. this.params should be available in IIFE function in API editor", () => {
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
