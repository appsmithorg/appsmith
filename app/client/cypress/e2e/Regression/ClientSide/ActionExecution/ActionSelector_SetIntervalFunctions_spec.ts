import {
  agHelper,
  apiPage,
  appSettings,
  assertHelper,
  dataManager,
  deployMode,
  draggableWidgets,
  entityExplorer,
  homePage,
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

    // possible bug
    // it.skip("3. Verify behavior when an invalid callback function is passed to setInterval(). An error should be thrown, and no interval should be set.", () => {
    //  EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    // //Buttom mode verification
    // agHelper.ClickButton("Submit3_1");
    // agHelper.ValidateToastMessage("Error found", 0, 2);
    // //Deploy mode verification
    // deployMode.DeployApp();
    // agHelper.AssertElementVisibility(appSettings.locators._header);
    // agHelper.ClickButton("Submit3_1");
    // agHelper.ValidateToastMessage("Error found", 0, 2);

    // deployMode.NavigateBacktoEditor();

    // //JS Object verification
    // EditorNavigation.SelectEntityByName("Submit3_2", EntityType.Widget);
    // agHelper.ClickButton("Submit3_2");
    // agHelper.ValidateToastMessage("Error found", 0, 2);

    // //Deploy mode verification
    // deployMode.DeployApp();
    // agHelper.AssertElementVisibility(appSettings.locators._header);
    // agHelper.ClickButton("Submit3_2");
    // agHelper.ValidateToastMessage("Error found", 0, 2);

    // deployMode.NavigateBacktoEditor();
    // agHelper.RefreshPage();
    // });

    //possible bug
    // it.skip("4. Verify behavior when an invalid time interval is provided. An error should be thrown, and no interval should be set.", () => {
    //   EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    //   //Buttom mode verification
    //   agHelper.ClickButton("Submit4_1");
    //   agHelper.ValidateToastMessage("Error found", 0, 2);
    //   //Deploy mode verification
    //   deployMode.DeployApp();
    //   agHelper.AssertElementVisibility(appSettings.locators._header);
    //   agHelper.ClickButton("Submit4_1");
    //   agHelper.ValidateToastMessage("Error found", 0, 2);

    //   deployMode.NavigateBacktoEditor();

    //   //JS Object verification
    //   EditorNavigation.SelectEntityByName("Submit4_2", EntityType.Widget);
    //   agHelper.ClickButton("Submit4_2");
    //   agHelper.ValidateToastMessage("Error found", 0, 2);

    //   //Deploy mode verification
    //   deployMode.DeployApp();
    //   agHelper.AssertElementVisibility(appSettings.locators._header);
    //   agHelper.ClickButton("Submit4_2");
    //   agHelper.ValidateToastMessage("Error found", 0, 2);

    //   deployMode.NavigateBacktoEditor();
    //   agHelper.RefreshPage();
    // });

    //Need to test more
    // it("5. Verify that intervals are cleared after a page refresh.", () => {
    //   agHelper.RefreshPage();
    //   EditorNavigation.SelectEntityByName("Submit5_2", EntityType.Widget);
    //   agHelper.ClickButton("Submit5_2");
    //   agHelper.ValidateToastMessage(
    //     "Interval started successfully with jsobject.",
    //     0,
    //     2,
    //   );
    //   agHelper.RefreshPage();
    //   agHelper.AssertElementAbsence(locators._toastMsg);

    //   //Deploy mode verification
    //   deployMode.DeployApp();
    //   agHelper.ClickButton("Submit5_2");
    //   agHelper.ValidateToastMessage(
    //     "Interval started successfully with jsobject.",
    //     0,
    //     2,
    //   );
    //   agHelper.RefreshPage();
    //   agHelper.AssertElementAbsence(locators._toastMsg);
    //   deployMode.NavigateBacktoEditor();
    //   agHelper.RefreshPage();
    // });
  },
);
