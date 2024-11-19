import {
  agHelper,
  apiPage,
  assertHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "Test Create Api and Bind to Button widget",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
    before("Test_Add users api and execute api", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      cy.fixture("TestDataSet1").then(function (dataSet) {
        apiPage.CreateAndFillApi(dataSet.userApi + "/random");
      });
    });

    it("1. Call the api with & without error handling", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{Api1.run()}}");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      );
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ValidateToastMessage("failed to execute", 0, 1);
      deployMode.NavigateBacktoEditor();

      //With Error handling
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", "{{Api1.run(() => {}, () => {})}}");
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(
        locators._widgetInDeployed(draggableWidgets.BUTTON),
      );
      agHelper.ClickButton("Submit");
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.AssertElementAbsence(locators._toastMsg);
    });
  },
);
