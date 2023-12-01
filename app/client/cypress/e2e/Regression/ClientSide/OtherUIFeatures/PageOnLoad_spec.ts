import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

const explorer = require("../../../../locators/explorerlocators.json");
const testdata = require("../../../../fixtures/testdata.json");

import {
  agHelper,
  entityExplorer,
  propPane,
  apiPage,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Check debugger logs state when there are onPageLoad actions", function () {
  before(() => {
    agHelper.AddDsl("debuggerTableDsl");
  });

  it("1. Check debugger logs state when there are onPageLoad actions", function () {
    EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods, "TestApi");
    apiPage.RunAPI();
    agHelper.GetNClick(explorer.addWidget);
    agHelper.RefreshPage();
    // Wait for the debugger icon to be visible
    agHelper.AssertElementVisibility(".t--debugger-count");
    // debuggerHelper.isErrorCount(0);
    cy.wait("@postExecute");
    debuggerHelper.AssertErrorCount(1);
  });
});
