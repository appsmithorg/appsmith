import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  EntityExplorer: ee,
  JSEditor: jsEditor,
  CommonLocators: locator,
  DeployMode: deployMode,
} = ObjectsRegistry;

describe("storeValue Action test", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 100, 100);
    ee.NavigateToSwitcher("explorer");
  });

  it("1. Bug 14653: Running consecutive storeValue actions and await", function() {
    const jsObjectBody = `export default {
      storeTest: () => {
        let values =
          [
            storeValue('val1', 'number 1'),
            storeValue('val2', 'number 2'),
            storeValue('val3', 'number 3'),
            storeValue('val4', 'number 4')
          ]
        return Promise.all(values)
          .then(() => {
            showAlert(JSON.stringify(appsmith.store))
        })
          .catch((err) => {
            return showAlert('Could not store values in store ' + err.toString());
          })
      }
    }`;

    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObj: any) => {
      agHelper.SelectPropertiesDropDown("onClick", "Execute a JS function");
      agHelper.GetNClick(locator._dropDownValue(jsObj as string), 0, true);
      agHelper.GetNClick(locator._dropDownValue("storeTest"), 0, true);
    });

    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage(
      JSON.stringify({
        val1: "number 1",
        val2: "number 2",
        val3: "number 3",
        val4: "number 4",
      }),
    );
    deployMode.NavigateBacktoEditor();
  });

  it("2. Accepts paths as keys and updates path accordingly", function() {
    const JS_OBJECT_BODY = `export default {
      storePathTest: async ()=> {
      await storeValue("student", {details:{isTopper:true, name: "Abhah", grade: 1}}, false)
      await showAlert(JSON.stringify(appsmith.store.student.details));
      await storeValue("student.details.name", "Annah", false);
      await showAlert(appsmith.store.student.details.name);
      await storeValue("student", {details:{isTopper:false, name: "Alia", grade: 3}}, false)
      await showAlert(appsmith.store.student.details.isTopper.toString());
     }
     }
 `;

    // create js object
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    ee.SelectEntityByName("Button1", "WIDGETS");
    cy.get("@jsObjName").then((jsObj: any) => {
      agHelper.SelectPropertiesDropDown("onClick", "Execute a JS function");
      agHelper.GetNClick(locator._dropDownValue(jsObj as string), 0, true);
      agHelper.GetNClick(locator._dropDownValue("storePathTest"), 0, true);
    });

    deployMode.DeployApp();
    agHelper.ClickButton("Submit");
    agHelper.ValidateToastMessage('{"isTopper":true,"name":"Abhah","grade":1}', 0);
    agHelper.ValidateToastMessage("Annah", 1);
    agHelper.ValidateToastMessage("false", 2);
    deployMode.NavigateBacktoEditor();
  });
});
