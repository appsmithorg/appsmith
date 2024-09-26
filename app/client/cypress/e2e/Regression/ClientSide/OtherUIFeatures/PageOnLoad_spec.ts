import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import {
  agHelper,
  apiPage,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";
const testdata = require("../../../../fixtures/testdata.json");

describe(
  "Check debugger logs state when there are onPageLoad actions",
  { tags: ["@tag.IDE", "@tag.Datasource"] },
  function () {
    before(() => {
      agHelper.AddDsl("debuggerTableDsl");
    });

    it("1. Check debugger logs state when there are onPageLoad actions", function () {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods, "TestApi");
      apiPage.RunAPI();
      EditorNavigation.ShowCanvas();
      agHelper.RefreshPage();
      // Wait for the debugger icon to be visible
      agHelper.AssertElementVisibility(".t--debugger-count");
      // debuggerHelper.isErrorCount(0);
      cy.wait("@postExecute");
      debuggerHelper.AssertErrorCount(1);
    });
  },
);
