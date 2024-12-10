import {
  agHelper,
  appSettings,
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
  "To verify action selector - copyToClipboard function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 100, 100);
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT, 200, 200);
    });

    it("1. Verify that JSON data can be copied to the clipboard and recognized properly.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
        `{ name: "John", age: 30 }`,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);

      cy.get("@copyToClipboardPrompt").should("be.called");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(`{ name: "John", age: 30 }`);
      });

      // Deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      cy.get("@copyToClipboardPrompt").should("be.called");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(`{ name: "John", age: 30 }`);
      });
      deployMode.NavigateBacktoEditor();

      // JSObject verification
      const jsObjectBody = `export default {
        myFun1() {
          const data = '{ name: "John", age: 30 }';
          copyToClipboard(data);
          showAlert(data, "info"); // Use Appsmith's showAlert function
          return data;
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
      agHelper.ValidateToastMessage(`{ name: "John", age: 30 }`, 0, 2);
      deployMode.DeployApp();
      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage(`{ name: "John", age: 30 }`, 0, 2);
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

    it("2. Verify behavior when attempting to copy an empty string to the clipboard. The clipboard should remain empty, and no error should be triggered.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
        ``,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);
      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(``);
      });
      // Deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);

      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(``);
      });
      deployMode.NavigateBacktoEditor();

      // JSObject verification
      const jsObjectBody = `export default {
        myFun1() {
          const data = '';
          copyToClipboard(data);
          showAlert(data, "info"); // Use Appsmith's showAlert function
          return data;
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
      agHelper
        .GetElement(locators._toastMsg)
        .should("have.length", 1)
        .and("have.text", ""); // Assert that the text content of the toast is empty
      deployMode.DeployApp();
      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      agHelper
        .GetElement(locators._toastMsg)
        .should("have.length", 1)
        .and("have.text", ""); // Assert that the text content of the toast is empty
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

    it("3. Verify that copied data persists in the clipboard after a page reload. The copied data should still be in the clipboard after the page reload.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.SelectPlatformFunction("onClick", "Copy to clipboard");
      agHelper.TypeText(
        propPane._actionSelectorFieldByLabel("Text to be copied to clipboard"),
        `{ name: "John", age: 30 }`,
      );
      agHelper.GetNClick(propPane._actionSelectorPopupClose);

      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      cy.get("@copyToClipboardPrompt").should("be.called");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(`{ name: "John", age: 30 }`);
      });

      // Reload the page
      agHelper.RefreshPage();

      // Verify clipboard data after reload
      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      cy.get("@copyToClipboardPrompt").should("be.called");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(`{ name: "John", age: 30 }`);
      });

      // Deploy verification
      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      cy.window().then((win) => {
        cy.stub(win, "prompt").returns(win.prompt).as("copyToClipboardPrompt");
      });
      agHelper.ClickButton("Submit");
      cy.get("@copyToClipboardPrompt").should("be.called");
      cy.get("@copyToClipboardPrompt").should((prompt) => {
        expect(prompt.args[0][1]).to.equal(`{ name: "John", age: 30 }`);
      });
      deployMode.NavigateBacktoEditor();
    });
  },
);
