import {
  agHelper,
  appSettings,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - reset widget function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.INPUT_V2, 200, 200);
    });

    it("1. Verify the behavior when an invalid widget name is provided. The function should not reset any widget, and an appropriate error should be logged.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{resetWidget("Input2", true);}}`,
        true,
        false,
      );
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget Input2 not found`, 0, 2);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget Input2 not found`, 0, 2);
      deployMode.NavigateBacktoEditor();

      // JSObject verification
      const jsObjectBody = `export default {
          myFun1() {
            try {
              const result = resetWidget("Input2", true);
              return result;
            } catch (error) {
              showAlert("Error: " + error.message);
              return null;
            }
          },
        };`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });

      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget Input2 not found`, 0, 2);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget Input2 not found`, 0, 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("2. Verify the behavior when attempting to reset a widget that has no child widgets, but resetChildren is set to true.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{resetWidget("Input1", true);}}`,
        true,
        false,
      );
      propPane.ToggleJSMode("onClick", false);
      propPane.SelectPlatformFunction("onClick", "Reset widget");
      dataSources.ValidateNSelectDropdown("Widget", "Select widget", "Input1");
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      // JSObject verification
      const jsObjectBody = `export default {
        myFun1() {
          try {
          const result = resetWidget("Input1", true);
          return result;
          } catch (error) {
          showAlert("Error: " + error.message);
          return null;
          }
        },
        };`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });

      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });

    it("3. Verify behavior when trying to reset a widget that does not exist on the page. No widget should reset, and an appropriate error or message should be logged.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext(
        "onClick",
        `{{resetWidget("NonExistentWidget", false);}}`,
        true,
        false,
      );
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget NonExistentWidget not found`, 0, 2);

      // Deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget NonExistentWidget not found`, 0, 2);
      deployMode.NavigateBacktoEditor();

      // JSObject verification
      const jsObjectBody = `export default {
        myFun1() {
          try {
            const result = resetWidget("NonExistentWidget", false);
            return result;
          } catch (error) {
            showAlert("Error: " + error.message);
            return null;
          }
        },
      };`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });
      agHelper.GetText(jsEditor._jsObjName).then((jsObjectName: string) => {
        cy.wrap(jsObjectName).as("jsObjectName");
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });

      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget NonExistentWidget not found`, 0, 2);
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`Widget NonExistentWidget not found`, 0, 2);
      deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.WaitUntilEleAppear(locators._jsToggle("onClick"));
      propPane.ToggleJSMode("onClick", false);
      agHelper.WaitUntilEleAppear(
        propPane._actionCardByTitle("Execute a JS function"),
      );
      agHelper.GetNClick(propPane._actionCardByTitle("Execute a JS function"));
      agHelper.GetNClick(propPane._actionSelectorDelete);
    });
  },
);
