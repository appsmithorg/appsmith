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
      agHelper.ClickButton("Submit1_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("2. Verify the behaviour while clearing interval using wrong ID. The interval should not be cleared.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit2_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit2_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      deployMode.NavigateBacktoEditor();

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit2_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit2_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is notcleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      deployMode.NavigateBacktoEditor();
    });

    it("3. Verify behavior when calling clearInterval() with an invalid or non-existent ID. No interval should be cleared, and the system should handle the invalid ID gracefully without errors.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit3_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit3_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      deployMode.NavigateBacktoEditor();

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit3_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit3_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      deployMode.NavigateBacktoEditor();
    });

    it("4. Verify that multiple intervals can be cleared simultaneously without any issues.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setMulIntrvl");
      agHelper.ValidateToastMessage("Interval 1", 0, 2);
      agHelper.ValidateToastMessage("Interval 2", 0, 2);
      agHelper.ClickButton("Submit4_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setMulIntrvl");
      agHelper.ValidateToastMessage("Interval 1", 0, 2);
      agHelper.ValidateToastMessage("Interval 2", 0, 2);
      agHelper.ClickButton("Submit4_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setMulIntrvl");
      agHelper.ValidateToastMessage("Interval 1", 0, 2);
      agHelper.ValidateToastMessage("Interval 2", 0, 2);
      agHelper.ClickButton("Submit4_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setMulIntrvl");
      agHelper.ValidateToastMessage("Interval 1", 0, 2);
      agHelper.ValidateToastMessage("Interval 2", 0, 2);
      agHelper.ClickButton("Submit4_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("5. Verify behavior when calling clearInterval() multiple times on the same interval.The interval should be cleared the first time, and no errors should occur upon subsequent calls.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.ClickButton("Submit1_1");
      agHelper.ClickButton("Submit1_1");
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.ClickButton("Submit1_1");
      agHelper.ClickButton("Submit1_1");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.ClickButton("Submit1_2");
      agHelper.ClickButton("Submit1_2");
      agHelper.AssertElementAbsence(locators._toastMsg);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit1_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is cleared.
      agHelper.ClickButton("Submit1_2");
      agHelper.ClickButton("Submit1_2");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("6. Verify behavior when clearInterval() is called without an ID.", () => {
      agHelper.ClickButton("clearAllInterval");
      //Buttom mode verification
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit6_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit6_1");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      deployMode.NavigateBacktoEditor();

      //JSObject mode verification
      agHelper.ClickButton("clearAllInterval");
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit6_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is not cleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);

      //Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("setIntvl");
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("Submit6_2");
      agHelper.Sleep(6000); // This is mandatory sleep as we need to check interval is notcleared.
      agHelper.ValidateToastMessage("Interval started.", 0, 2);
      agHelper.ClickButton("clearAllInterval");
    });
  },
);
