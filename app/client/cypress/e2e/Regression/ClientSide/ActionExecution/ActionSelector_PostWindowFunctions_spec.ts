import { CommonLocators } from "../../../../support/Objects/CommonLocators";
import {
  agHelper,
  apiPage,
  appSettings,
  assertHelper,
  dataManager,
  debuggerHelper,
  deployMode,
  draggableWidgets,
  entityExplorer,
  homePage,
  jsEditor,
  locators,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - PostWindow function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      homePage.NavigateToHome();
      homePage.ImportApp("IframeWidgetQA.json");
      EditorNavigation.SelectEntityByName("PostMessage", EntityType.Page);
    });

    it.skip("1. Verify that postWindowMessage() can successfully send a message to the parent application’s window.", () => {
      EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
      agHelper.ClickButton("Button2");
      debuggerHelper.OpenDebugger();
      agHelper.GetNClick(jsEditor._logsTab);
      debuggerHelper.DoesConsoleLogExist("Hello from  to parent window!");
    });

    it.skip("2. Verify that postWindowMessage() can successfully send a message to a specified iframe embedded within Appsmith.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.ClickButton("Button2");
      agHelper.GetNClick(jsEditor._logsTab);
      debuggerHelper.DoesConsoleLogExist(
        "Hello from Appsmith parent to embedded iframe!",
      );
    });

    it("3. Verify the behavior of postWindowMessage() when sending an empty message.", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
      propPane.SelectPlatformFunction("onClick", "Post message");
      agHelper.EnterActionValue("Message", "");
      agHelper.GetNClick(propPane._windowTargetDropdown);
      agHelper.GetNClick(locators._dropDownValue("Iframe1"), 0, true);
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Button3");
      agHelper.AssertElementAbsence(locators._toastMsg);

      deployMode.DeployApp();
      agHelper.ClickButton("Button3");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("4. Verify behavior when an invalid or malformed URL is provided as targetOrigin.", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.IFRAME, 200, 300);
      EditorNavigation.SelectEntityByName("Iframe2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("URL", " ");
      // cy.get(locators._codeEditorTargetTextArea).eq(0).type('{del}', { force: true });
      agHelper.SelectNRemoveLineText(locators._existingFieldTextByName("URL"));
      agHelper.AssertContains("Valid source URL is required");
    });
  },
);
