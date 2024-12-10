import {
  agHelper,
  apiPage,
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
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "To verify action selector - Show Modal function",
  { tags: ["@tag.JS"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    it("1. To verify a modal is displayed automatically when the page loads using a JSObject with 'Run on Page Load' enabled.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.CreateModal("onClick");
      agHelper.GetNClick(locators._closeModal, 0, true, 0);

      const jsObjectBody = `export default {
        myFun1 () {
         {{showModal(Modal1.name);}}
        },
      }`;

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

      apiPage.clickSettingIcon(true);

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.RefreshPage();
      agHelper.AssertElementVisibility(locators._modalWrapper);
      agHelper.AssertText(locators._modalButtonText, "text", "Confirm", 2);
      agHelper.AssertText(locators._modalButtonText, "text", "Close", 1);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.RefreshPage();
      agHelper.AssertElementVisibility(locators._modalWrapper);
      agHelper.AssertText(locators._modalButtonText, "text", "Confirm", 2);
      agHelper.AssertText(locators._modalButtonText, "text", "Close", 1);
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      deployMode.NavigateBacktoEditor();
    });

    it("2. To verify the modal remains in focus after it is opened using the showModal() function preventing interaction with the underlying page.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      agHelper.ClickButton("Submit");
      cy.get(locators._closeModal).focus().should("have.focus");
      agHelper.RefreshPage();
    });

    it("3. To verify the behavior when an invalid modal name is provided to the showModal() function. The modal should not open, and an error should be thrown.", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showModal(Modal2.name);}}`, true);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);
      deployMode.NavigateBacktoEditor();

      const jsObjectBody = `export default {
        myFun1 () {
         {{showModal(Modal2.name);}}
        },
      }`;

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
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);
      deployMode.NavigateBacktoEditor();
    });

    it("4. To verify the behavior when an invalid modal name is provided to the closeModal() function. The modal should not close, and there should be no action and an error should be thrown", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showModal(Modal1.name);}}`, true);
      agHelper.ClickButton("Submit");
      PageLeftPane.expandCollapseItem("Modal1");
      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", `{{closeModal(Modal2.name);}}`, true);
      agHelper.RefreshPage();
      agHelper.ClickButton("Submit");
      agHelper.GetNClick(locators._modalButtonText, 0, true, 0);
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.GetNClick(locators._modalButtonText, 0, true, 0);
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);
      deployMode.NavigateBacktoEditor();
      agHelper.GetNClick(locators._closeModal, 0, true, 0);
      const jsObjectBody = `export default {
        myFun1 () {
         {{closeModal(Modal2.name);}}
        },
      }`;

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
      propPane.EnterJSContext("onClick", `{{showModal(Modal1.name);}}`, true);
      PageLeftPane.expandCollapseItem("Modal1");
      EditorNavigation.SelectEntityByName("IconButton1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      cy.get("@jsObjectName").then((jsObjectName: string) => {
        console.log("Mera variable: ", jsObjectName);
        propPane.EnterJSContext(
          "onClick",
          `{{${jsObjectName}.myFun1()}}`,
          true,
          false,
        );
      });
      agHelper.RefreshPage();
      agHelper.ClickButton("Submit");
      agHelper.GetNClick(locators._modalButtonText, 0, true, 0);
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.GetNClick(locators._modalButtonText, 0, true, 0);
      agHelper.ValidateToastMessage("Modal2 is not defined", 0, 1);
      deployMode.NavigateBacktoEditor();
    });
  },
);
