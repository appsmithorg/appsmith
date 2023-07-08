import {
  agHelper,
  entityExplorer,
  propPane,
  deployMode,
  apiPage,
  draggableWidgets,
  assertHelper,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe("Test Create Api and Bind to Button widget", function () {
  before("Test_Add users api and execute api", () => {
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    entityExplorer.NavigateToSwitcher("Explorer");
    cy.fixture("TestDataSet1").then(function (dataSet) {
      apiPage.CreateAndFillApi(dataSet.userApi + "/random");
    });
  });

  it("1. Call the api with & without error handling", () => {
    entityExplorer.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", "{{Api1.run()}}");
    deployMode.DeployApp();
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.ValidateToastMessage("failed to execute", 0, 1);
    deployMode.NavigateBacktoEditor();

    //With Error handling
    entityExplorer.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", "{{Api1.run(() => {}, () => {})}}");
    deployMode.DeployApp();
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    assertHelper.AssertNetworkStatus("@postExecute", 200);
    agHelper.AssertElementAbsence(locators._toastMsg);
  });
});
