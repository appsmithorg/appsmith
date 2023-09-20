import {
  agHelper,
  entityExplorer,
  propPane,
  apiPage,
  dataManager,
  draggableWidgets,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";

describe("Bug26935- Widget isLoading property", function () {
  before(() => {
    // Create Api1
    apiPage.CreateAndFillApi(dataManager.paginationUrl(100, 1));
    // Table1
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 100, 100);

    // Button1
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 500);

    // Text1
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 600);
  });
  it("1. Updates isLoading property of widgets when API/Query is executing", () => {
    entityExplorer.SelectEntityByName("Button1", "Widgets");
    propPane.EnterJSContext("onClick", `{{Api1.run()}}`, true, false);
    entityExplorer.SelectEntityByName("Text1", "Widgets");
    propPane.TypeTextIntoField(
      "Text",
      "Table1 isLoading: {{Table1.isLoading}}",
    );
    entityExplorer.SelectEntityByName("Table1", "Widgets");
    propPane.EnterJSContext("Table data", "{{Api1.data}}", true, false);

    agHelper.AssertContains("Table1 isLoading: false");
    agHelper.ClickButton("Submit");
    // After triggering API execution, check that isLoading is set to true
    agHelper.AssertContains("Table1 isLoading: true");
    agHelper.Sleep(2000);
    agHelper.AssertContains("Table1 isLoading: false");

    deployMode.DeployApp();

    agHelper.ClickButton("Submit");
    // After triggering API execution, check that isLoading is set to true
    agHelper.AssertContains("Table1 isLoading: true");
    agHelper.Sleep(2000);
    agHelper.AssertContains("Table1 isLoading: false");
  });
});
