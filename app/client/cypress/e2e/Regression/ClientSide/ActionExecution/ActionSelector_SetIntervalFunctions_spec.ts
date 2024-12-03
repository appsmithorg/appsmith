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

    it.skip("3. Verify behavior when an invalid callback function is passed to setInterval(). An error should be thrown, and no interval should be set.", () => {
      //JS Object verification
      EditorNavigation.SelectEntityByName("Submit3_2", EntityType.Widget);
      
      // Setup console spies and stub window.setInterval
      cy.window().then((win) => {
        cy.stub(win.console, 'error').as('consoleError');
        cy.stub(win, 'setInterval').callsFake((callback) => {
          try {
            callback();
          } catch (e) {
            win.console.error(e);
          }
          return 123; // Fake interval ID
        });
      });
      
      agHelper.ClickButton("Submit3_2");
      
      // Verify the error was logged
      cy.get('@consoleError').should('be.called')
        .then((spy) => {
          expect(spy.args[0][0].toString()).to.include('testInvalid');
        });

      // Deploy mode verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      
      // Setup console spies again for deploy mode
      cy.window().then((win) => {
        cy.stub(win.console, 'error').as('consoleErrorDeploy');
        cy.stub(win, 'setInterval').callsFake((callback) => {
          try {
            callback();
          } catch (e) {
            win.console.error(e);
          }
          return 123; // Fake interval ID
        });
      });
      
      agHelper.ClickButton("Submit3_2");
      
      // Verify the error in deploy mode
      cy.get('@consoleErrorDeploy').should('be.called')
        .then((spy) => {
          expect(spy.args[0][0].toString()).to.include('testInvalid');
        });
      
      deployMode.NavigateBacktoEditor();
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
