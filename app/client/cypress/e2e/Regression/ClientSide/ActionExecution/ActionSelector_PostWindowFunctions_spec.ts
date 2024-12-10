import {
  agHelper,
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
      homePage.ImportApp("IframeWidgetPostMessage.json");
    });

    const getIframeBody = (i: number) => {
      return cy
        .get(".t--draggable-iframewidget iframe")
        .eq(i)
        .its("0.contentDocument.body")
        .should("not.be.empty")
        .then(cy.wrap);
    };


    it("1. Verify that postWindowMessage() can successfully send a message to the parent application’s window.", () => {
      agHelper.ClickButton("Submit", { force: true });
      getIframeBody(0)
        .find("input")
        .should("be.visible")
        .invoke("val")
        .then((inputValue) => {
          expect(inputValue).to.equal("submitclicked");
        });
    });

    it("2. Verify that postWindowMessage() can successfully send a message to a specified iframe embedded within Appsmith.", () => {
      getIframeBody(0).find('#test > input').clear().type("Sample Text");
      agHelper.ClickButton("Submit", { force: true });
      agHelper.ValidateToastMessage("Hey Iframe Called.");
    });

    it("3. Verify the behavior of postWindowMessage() when sending an empty message.", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
      propPane.SelectPlatformFunction("onClick", "Post message");
      agHelper.EnterActionValue("Message", "");
      agHelper.GetNClick(propPane._windowTargetDropdown);
      agHelper.GetNClick(locators._dropDownValue("Iframe1"), 0, true);
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);

      deployMode.DeployApp();
      agHelper.ClickButton("Submit");
      agHelper.AssertElementAbsence(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("4. Verify behavior when an invalid or malformed URL is provided as targetOrigin.", () => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.IFRAME, 200, 300);
      EditorNavigation.SelectEntityByName("Iframe2", EntityType.Widget);
      propPane.UpdatePropertyFieldValue("URL", " ");
      agHelper.SelectNRemoveLineText(locators._existingFieldTextByName("URL"));
      agHelper.AssertContains("Valid source URL is required");
    });
  },
);
