import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Check debugger logs state when there are onPageLoad actions", function () {
  before(() => {
    cy.fixture("debuggerTableDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });
  it("Check debugger logs state when there are onPageLoad actions", function () {
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Table Data", "{{TestApi.data.users}}");
    cy.fixture("datasources").then((datasourceFormData) => {
      _.apiPage.CreateAndFillApi(datasourceFormData["mockApiUrl"], "TestApi");
    });
    _.apiPage.RunAPI();
    //cy.get(explorer.addWidget).click();
    _.agHelper.RefreshPage();
    _.agHelper.AssertElementVisible(_.debuggerHelper.locators._debuggerIcon);
    // Wait for the debugger icon to be visible
    cy.get(".t--debugger").should("be.visible");
    // debuggerHelper.isErrorCount(0);
    _.agHelper.ValidateNetworkStatus("@postExecute");
    _.debuggerHelper.AssertErrorCount(1);
  });
});
