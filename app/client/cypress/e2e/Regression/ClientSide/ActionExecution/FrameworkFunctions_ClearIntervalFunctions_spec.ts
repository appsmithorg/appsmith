import {
  agHelper,
  appSettings,
  deployMode,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "To verify action selector - clearInterval function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("clearIntervalApp.json");
    });

    it("1. To verify that calling clearInterval() stops the interval from executing further.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_1", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg, 3000); // retry through the toast exit animation

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_2", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg, 3000); // retry through the toast exit animation

      //Deploy mode verification - button and JSObject in the same deployed page
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_1", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg, 3000); // retry through the toast exit animation

      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_2", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg, 3000); // retry through the toast exit animation
      deployMode.NavigateBacktoEditor();
    });

    it("2. Verify that clearInterval() with a wrong ID, an invalid ID, or no ID does not clear the interval and does not error.", () => {
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      //Button mode: wrong string ID, invalid numeric ID, no ID
      agHelper.ClickButton("Submit2_1");
      agHelper.ClickButton("Submit3_1");
      agHelper.ClickButton("Submit6_1");
      //JSObject mode: wrong string ID, invalid numeric ID, no ID
      agHelper.ClickButton("Submit2_2");
      agHelper.ClickButton("Submit3_2");
      agHelper.ClickButton("Submit6_2", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
    });

    it("3. Verify that multiple intervals can be cleared simultaneously without any issues.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setMulIntrvl");
      agHelper.ValidateToastMessage("Interval 1", 0, 2);
      agHelper.ValidateToastMessage("Interval 2", 0, 2);
      agHelper.ClickButton("Submit4_1", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg, 3000); // retry through the toast exit animation

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setMulIntrvl");
      agHelper.ValidateToastMessage("Interval 1", 0, 2);
      agHelper.ValidateToastMessage("Interval 2", 0, 2);
      agHelper.ClickButton("Submit4_2", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg, 3000); // retry through the toast exit animation
    });

    it("4. Verify behavior when calling clearInterval() multiple times on the same interval.The interval should be cleared the first time, and no errors should occur upon subsequent calls.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_1", { waitAfterClick: false });
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.ClickButton("Submit1_1");
      agHelper.ClickButton("Submit1_1");
      agHelper.AssertElementAbsence(locators._toastMsg);
    });
  },
);
