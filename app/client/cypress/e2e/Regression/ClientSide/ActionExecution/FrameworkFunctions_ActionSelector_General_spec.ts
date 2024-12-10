import {
  agHelper,
  appSettings,
  deployMode,
  draggableWidgets,
  entityExplorer,
  homePage,
  locators,
  partialImportExport,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

describe(
  "To verify action selector - action selector general functions",
  { tags: ["@tag.JS"] },
  () => {
    let modalTextValue: string,
      currentAppName: string = "ActionSelectorAppNew",
      currentWorkspace: string,
      forkWorkspaceName: string;

    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
      cy.get("@workspaceName").then((workspaceName: any) => {
        currentWorkspace = workspaceName;
      });
    });

    it("1. Verify that actions can be configured ", () => {
      propPane.EnterJSContext(
        "onClick",
        `{{showAlert("Action Selector Test Message", '')}}`,
        true,
      );
      propPane.ToggleJSMode("onClick", false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Action Selector Test Message", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Action Selector Test Message", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("2. Verify that callbacks can be configured with a success event", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{showAlert("Action Success Message", '')}}`,
      );
      propPane.ToggleJSMode("onClick", false);

      agHelper.GetNClick(propPane._actionCardByTitle("Show alert"));

      // add a success callback
      agHelper.GetNClick(propPane._actionAddCallback("success"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Success Callback",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("3. Verify that callbacks can be configured with a failure event", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", `{{showModal()}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetHoverNClick(propPane._actionCallbacks);

      agHelper.GetNClick(propPane._actionAddCallback("failure"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Failure Callback",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("4. Verify that callbacks can be chained", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetHoverNClick(propPane._actionCallbacks);

      agHelper.GetNClick(propPane._actionAddCallback("failure"));
      agHelper.GetNClick(locators._dropDownValue("Show alert"));
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Message"),
        "Second Failure Callback",
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Second Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Second Failure Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("5. Verify that the Callbacks section reflects the number of active callbacks accurately", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.GetHoverNClick(propPane._actionCallbacks);
      agHelper
        .GetText(propPane._getActionCardSelector("modal"))
        .then(($count) => {
          modalTextValue = $count as string;
          expect(modalTextValue).to.contain("+2");
        });
    });

    it("6. Verify that callbacks can be deleted", () => {
      agHelper.GetNClick(propPane._getActionCardSelector("alert"), 1);
      agHelper.GetNClick(propPane._actionSelectorDelete, 0);
      agHelper
        .GetText(propPane._getActionCardSelector("modal"))
        .then(($count) => {
          modalTextValue = $count as string;
          expect(modalTextValue).to.contain("+1");
        });
    });

    it("7. Verify that configured actions stay intact on partial import of a page", () => {
      PageList.AddNewPage("New blank page");
      partialImportExport.OpenImportModalWithPage("Page2");

      // Import Widgets
      partialImportExport.ImportPartiallyExportedFile(
        "frameworkFunPartialPage.json",
        "Widgets",
        ["Button1"],
      );
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("success alert", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("success alert", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("8. Verify that configured actions stay intact on navigating between pages", () => {
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("9. Verify that configured actions stay intact on forking an app", () => {
      homePage.RenameApplication("ActionSelectorAppNew");
      forkWorkspaceName = "ForkAppWorkspace";
      homePage.CreateNewWorkspace(forkWorkspaceName, true);
      homePage.SelectWorkspace(currentWorkspace);
      homePage.ForkApplication(currentAppName, forkWorkspaceName);

      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("10. Verify that configured actions stay intact on import of an app", () => {
      homePage.NavigateToHome();
      homePage.ImportApp(
        "ActionSelectorAppNewExported.json",
        "ForkAppWorkspace",
      );
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper
        .GetText(propPane._getActionCardSelector("modal"))
        .then(($count) => {
          modalTextValue = $count as string;
          expect(modalTextValue).to.contain("+1");
        });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Failure Callback", 0, 1);
    });
  },
);
