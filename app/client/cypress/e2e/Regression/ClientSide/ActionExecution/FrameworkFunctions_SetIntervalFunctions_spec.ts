import {
  agHelper,
  appSettings,
  assertHelper,
  dataSources,
  debuggerHelper,
  deployMode,
  homePage,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - setInterval function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("setIntervalApp.json");
    });

    it("1. Verify that the callback function is executed at regular intervals specified by the setInterval() function.", () => {
      //Buttom mode verification
      agHelper.ClickButton("Submit1_1");
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit1_1");
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      deployMode.NavigateBacktoEditor();

      //JS Object verification
      EditorNavigation.SelectEntityByName("Submit1_2", EntityType.Widget);
      agHelper.ClickButton("Submit1_2");
      agHelper.ValidateToastMessage(
        "Interval started successfully with jsobject.",
        0,
        2,
      );
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit1_2");
      agHelper.ValidateToastMessage(
        "Interval started successfully with jsobject.",
        0,
        2,
      );
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      deployMode.NavigateBacktoEditor();
      agHelper.RefreshPage();
    });

    it("2. Verify that multiple setInterval() functions can run at the same time.", () => {
      //Buttom mode verification
      agHelper.ClickButton("Submit2_1");
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit2_1");
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      deployMode.NavigateBacktoEditor();

      //JS Object verification
      EditorNavigation.SelectEntityByName("Submit2_2", EntityType.Widget);
      agHelper.ClickButton("Submit2_2");
      agHelper.ValidateToastMessage("Api1 executed", 0, 2);
      agHelper.ValidateToastMessage("Api2 executed", 0, 2);
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit2_2");
      agHelper.ValidateToastMessage("Api1 executed", 0, 2);
      agHelper.ValidateToastMessage("Api2 executed", 0, 2);
      assertHelper.AssertNetworkStatus("postExecute");
      assertHelper.AssertNetworkStatus("postExecute");
      deployMode.NavigateBacktoEditor();
      agHelper.RefreshPage();
    });

    it("3. Verify behavior when an invalid callback function is passed to setInterval(). An error should be thrown, and no interval should be set.", () => {
      //JS Object verification
      EditorNavigation.SelectEntityByName("Submit3_2", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{setInterval(() => {
              testInvalid123();
            }, 2000, "testingFun");}}`,
      );
      agHelper.ClickButton("Submit3_2");
      debuggerHelper.AssertDebugError(
        "'testInvalid123' is not defined.",
        "",
        true,
        false,
      );
      agHelper.RefreshPage();
    });

    it("4. Verify behavior when an invalid time interval is provided. An error should be thrown, and no interval should be set.", () => {
      //JS Object verification
      EditorNavigation.SelectEntityByName("Submit4_2", EntityType.Widget);
      agHelper.ClickButton("Submit4_2");
      agHelper.ValidateToastMessage("dasdas is not defined", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit4_2");
      agHelper.ValidateToastMessage("dasdas is not defined", 0, 2);

      deployMode.NavigateBacktoEditor();
      agHelper.RefreshPage();
    });

    it("5. Verify that intervals are cleared after a page refresh.", () => {
      agHelper.RefreshPage();
      EditorNavigation.SelectEntityByName("Submit5_2", EntityType.Widget);
      agHelper.ClickButton("Submit5_2");
      agHelper.ValidateToastMessage("Interval started successfully.", 0, 2);
      agHelper.ValidateToastMessage("Interval triggered!", 0, 2);
      agHelper.RefreshPage();
      agHelper.Sleep(5000); // This sleep is needed for mandatory verification of 5 second interval.
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.ClickButton("Submit5_2");
      agHelper.ValidateToastMessage("Interval started successfully.", 0, 2);
      agHelper.ValidateToastMessage("Interval triggered!", 0, 2);
      cy.reload();
      agHelper.Sleep(5000); // This sleep is needed for mandatory verification of 5 second interval.
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
      agHelper.RefreshPage();
    });
  },
);
