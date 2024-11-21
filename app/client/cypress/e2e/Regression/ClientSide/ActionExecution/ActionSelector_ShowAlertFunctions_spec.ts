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
import commonlocators from "../../../../locators/commonlocators.json";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

describe(
  "JS to non-JS mode in Action Selector",
  { tags: ["@tag.JS", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON);
    });

    //Please check requirement for this test case
    it("1. To verify trigger the action without editing any field in the action selector dropdown - error should be for missing (blank) message and not something arbitrary like unexpected token", () => {
      propPane.EnterJSContext("onClick", `{{showAlert("", '')}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);
      deployMode.NavigateBacktoEditor();

      const jsObjectBody = `export default {
        myFun1 () {
         {{showAlert("", '')}}
        },
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject1.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("2. To verify Select alert type without adding any message and execute trigger - no error should be displayed", () => {
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showAlert("", '')}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.EnterValue(propPane._actionPopupTextLabel);
      propPane.UpdatePropertyFieldValue("Message", `_`);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);
      agHelper.ValidateToastMessage("_", 0, 1);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);
      agHelper.ValidateToastMessage("_", 0, 1);
      deployMode.NavigateBacktoEditor();

      const jsObjectBody = `export default {
        myFun1 () {
         {{showAlert("_", '')}}
        },
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject2.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.AssertElementVisibility(locators._toastMsg);
      deployMode.NavigateBacktoEditor();
    });

    it("3. To verify different message types works as expected when selected from the dropdown or added through code", () => {
      //Info alert
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showAlert("", '')}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.EnterValue(propPane._actionPopupTextLabel);
      propPane.UpdatePropertyFieldValue("Message", "Info Message");
      agHelper.GetNClick(propPane._dropdownSelectType, 0, true);
      agHelper.GetNClickByContains(commonlocators.selectMenuItem, `Info`);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Info Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("info");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Info Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("info");
        });
      deployMode.NavigateBacktoEditor();

      let jsObjectBody = `export default {
        myFun1 () {
         {{showAlert('Info Message', 'info');}}
        },
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject3.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Info Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("info");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Info Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("info");
        });
      deployMode.NavigateBacktoEditor();

      //Success alert
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showAlert("", '')}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.EnterValue(propPane._actionPopupTextLabel);
      propPane.UpdatePropertyFieldValue("Message", "Success Message");
      agHelper.GetNClick(propPane._dropdownSelectType, 0, true);
      agHelper.GetNClickByContains(commonlocators.selectMenuItem, `Success`);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("success");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("success");
        });
      deployMode.NavigateBacktoEditor();

      jsObjectBody = `export default {
        myFun1 () {
         {{showAlert('Success Message', 'success');}}
        },
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject4.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("success");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Success Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("success");
        });
      deployMode.NavigateBacktoEditor();

      //Warning alert
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showAlert("", '')}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.EnterValue(propPane._actionPopupTextLabel);
      propPane.UpdatePropertyFieldValue("Message", "Warning Message");
      agHelper.GetNClick(propPane._dropdownSelectType, 0, true);
      agHelper.GetNClickByContains(commonlocators.selectMenuItem, `Warning`);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Warning Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("warning");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Warning Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("warning");
        });
      deployMode.NavigateBacktoEditor();

      jsObjectBody = `export default {
        myFun1 () {
         {{showAlert('Warning Message', 'warning');}}
        },
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject5.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Warning Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("warning");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Warning Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("warning");
        });
      deployMode.NavigateBacktoEditor();

      //Error alert
      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.EnterJSContext("onClick", `{{showAlert("", '')}}`, true);
      propPane.ToggleJSMode("onClick", false);
      agHelper.GetNClick(propPane._actionCard, 0);
      agHelper.EnterValue(propPane._actionPopupTextLabel);
      propPane.UpdatePropertyFieldValue("Message", "Error Message");
      agHelper.GetNClick(propPane._dropdownSelectType, 0, true);
      agHelper.GetNClickByContains(commonlocators.selectMenuItem, `Error`);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Error Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("error");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Error Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("error");
        });
      deployMode.NavigateBacktoEditor();

      jsObjectBody = `export default {
        myFun1 () {
         {{showAlert('Error Message', 'error');}}
        },
      }`;

      jsEditor.CreateJSObject(jsObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        prettify: false,
        shouldCreateNewJSObj: true,
      });

      EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
      propPane.ToggleJSMode("onClick", true);
      propPane.EnterJSContext("onClick", "{{JSObject6.myFun1()}}", true, false);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Error Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("error");
        });

      deployMode.DeployApp();
      agHelper.AssertElementVisibility(appSettings.locators._header);
      agHelper.ClickButton("Submit");
      agHelper.ValidateToastMessage("Error Message", 0, 2);
      agHelper
        .GetAttribute(commonlocators.tostifyIcon, "type")
        .then((labelValue) => {
          expect(labelValue).to.contain("error");
        });
      deployMode.NavigateBacktoEditor();
    });
  },
);
