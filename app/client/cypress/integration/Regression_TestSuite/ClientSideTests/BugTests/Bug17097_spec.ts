import * as _ from "../../../../support/Objects/ObjectsCore";

let dataSet: any;

describe("1. Bug 17097: Same widget names in different pages causes widget to show stale value", () => {
  before(() => {
    cy.fixture("example").then(function (data: any) {
      dataSet = data;
    });
  });

  it(" Checks if RESET_DATA_TREE was fired when changing pages where widgets have the same name", () => {
    // add page 1 with api and a table
    _.entityExplorer.SelectEntityByName("Page1", "Pages");
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
    _.propPane.UpdatePropertyFieldValue(
      "Table Data",
      JSON.stringify(dataSet.TableInput),
    );

    // add page 2 with api on load and a table widget
    _.entityExplorer.AddNewPage();
    _.apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users", "Api1");
    _.apiPage.ToggleOnPageLoadRun(true);
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
    _.propPane.UpdatePropertyFieldValue(
      "Table Data",
      "{{Api1.data ? Api1.data.users : []}}",
    );

    // deploy app
    _.deployMode.DeployApp();
    _.agHelper.GetNClick("Page2");
    _.agHelper.AssertAutoSave();
  });
});
