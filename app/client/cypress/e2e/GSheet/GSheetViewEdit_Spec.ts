import {
  agHelper,
  dataSources,
  deployMode,
  entityExplorer,
  homePage,
  table,
} from "../../support/Objects/ObjectsCore";

describe.skip("Authorized GSheet - in Edit & view mode", function () {
  it("Open already created GSheet in View mode, navigate back to Edit mode, Validate dropdown values", () => {
    homePage.NavigateToHome();
    homePage.FilterApplication("GSheet");
    agHelper.GetElement(homePage._applicationCard).trigger("mouseover");
    homePage.LaunchAppFromAppHover();
    table.WaitUntilTableLoad(0, 0, "v2");
    deployMode.NavigateBacktoEditor();
    //homePage.EditAppFromAppHover();
    entityExplorer.SelectEntityByName("Api1");
    dataSources.ValidateNSelectDropdown(
      "Spreadsheet",
      "Trial-GSheetAutomation",
    );
    dataSources.ValidateNSelectDropdown("Sheet name", "Analysis");
    dataSources.RunQuery();
    dataSources.AssertQueryResponseHeaders([
      "Failing Spec",
      "Reason",
      "Pod",
      "rowIndex",
    ]);
    dataSources.AssertQueryTableResponse(
      0,
      "Regression_TestSuite/ClientSideTests/Git/GitWithJSLibrary/GitwithCustomJSLibrary_spec.js",
    );
  });
});
