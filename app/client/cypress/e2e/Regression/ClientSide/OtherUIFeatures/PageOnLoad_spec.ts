const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Check debugger logs state when there are onPageLoad actions", function () {
  before(() => {
    _.agHelper.AddDsl("debuggerTableDsl");
  });
  it("1. Check debugger logs state when there are onPageLoad actions", function () {
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    _.propPane.UpdatePropertyFieldValue("Table data", "{{TestApi.data.users}}");
    _.apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods, "TestApi");
    _.apiPage.RunAPI();
    _.agHelper.GetNClick(explorer.addWidget);
    _.agHelper.RefreshPage();
    // Wait for the debugger icon to be visible
    _.agHelper.AssertElementVisible(".t--debugger-count");
    // debuggerHelper.isErrorCount(0);
    cy.wait("@postExecute");
    _.debuggerHelper.AssertErrorCount(1);
  });
});
