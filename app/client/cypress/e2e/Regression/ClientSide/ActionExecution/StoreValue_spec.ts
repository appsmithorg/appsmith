import {
  agHelper,
  debuggerHelper,
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
  PagePaneSegment,
} from "../../../../support/Pages/EditorNavigation";

describe("storeValue Action test", { tags: ["@tag.JS", "@tag.Sanity"] }, () => {
  before(() => {
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 100);
    PageLeftPane.switchSegment(PagePaneSegment.JS);
  });

  it("1. Bug 14653: Running consecutive storeValue actions and await", function () {
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

    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Label", "");
    propPane.TypeTextIntoField("Label", "StoreTest");
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "storeTest",
      );
    });

    deployMode.DeployApp();
    agHelper.AssertElementVisibility(
      locators._widgetInDeployed(draggableWidgets.BUTTON),
    );
    agHelper.ClickButton("StoreTest");
    agHelper.AssertContains(
      JSON.stringify({
        val1: "number 1",
        val2: "number 2",
        val3: "number 3",
        val4: "number 4",
      }),
    );
    deployMode.NavigateBacktoEditor();
  });

  it("2. Bug 14827 : Accepts paths as keys and doesn't update paths in store but creates a new field with path as key", function () {
    const DEFAULT_STUDENT_OBJECT = {
      details: { isTopper: true, name: "Abhah", grade: 1 },
    };
    const MODIFIED_STUDENT_OBJECT = {
      details: { isTopper: false, name: "Alia", grade: 3 },
    };
    const JS_OBJECT_BODY = `export default {
        storePathTest: async ()=> {
        await storeValue("student", ${JSON.stringify(
          DEFAULT_STUDENT_OBJECT,
        )}, false)
        await showAlert(JSON.stringify(appsmith.store.student));
        await storeValue("student.details.name", "Annah", false);
        await showAlert(appsmith.store.student.details.name);
        await showAlert(appsmith.store["student.details.name"]);
       },
       modifyStorePath: async ()=>{
        await storeValue("student",${JSON.stringify(
          MODIFIED_STUDENT_OBJECT,
        )} , false)
        await showAlert(JSON.stringify(appsmith.store.student));
        await storeValue("student.details.isTopper", true, false);
        await showAlert(appsmith.store.student.details.isTopper.toString());
        await showAlert(appsmith.store["student.details.isTopper"].toString());
       }
       }
   `;

    // Create js object
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    // Button1
    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Label", "StorePathTest");
    cy.get(".action-block-tree").click({ force: true });
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecuteInExistingActionBlock(
        jsObj,
        "storePathTest",
      );
    });

    // Button 2
    entityExplorer.DragDropWidgetNVerify("buttonwidget", 100, 200);
    EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Label", "modifyStorePath");
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "modifyStorePath",
      );
    });

    deployMode.DeployApp();
    agHelper.ClickButton("StorePathTest");
    agHelper.ValidateToastMessage(JSON.stringify(DEFAULT_STUDENT_OBJECT), 0, 1);
    agHelper.ValidateToastMessage(DEFAULT_STUDENT_OBJECT.details.name, 1, 2);
    agHelper.ValidateToastMessage("Annah", 2, 3);

    agHelper.WaitUntilAllToastsDisappear();
    agHelper.ClickButton("modifyStorePath");
    agHelper.ValidateToastMessage(
      JSON.stringify(MODIFIED_STUDENT_OBJECT.details),
      0,
      1,
    );
    agHelper.ValidateToastMessage(
      `${MODIFIED_STUDENT_OBJECT.details.isTopper}`,
      1,
      2,
    );
    agHelper.ValidateToastMessage(`true`, 2, 3);
    deployMode.NavigateBacktoEditor();
  });

  it("3. Bug 14827 : Accepts paths as keys and doesn't update paths in store but creates a new field with path as key - object keys", function () {
    const TEST_OBJECT = { a: 1, two: {} };

    const JS_OBJECT_BODY = `export default {
      setStore: async () => {
        await storeValue("test", ${JSON.stringify(TEST_OBJECT)}, false);
        await showAlert(JSON.stringify(appsmith.store.test));
        await storeValue("test.two",{"b":2}, false);
        await showAlert(JSON.stringify(appsmith.store.test.two));
        await showAlert(JSON.stringify(appsmith.store["test.two"]));
      },
      showStore: () =>  {
        showAlert(JSON.stringify(appsmith.store.test));}
    }`;

    // create js object
    jsEditor.CreateJSObject(JS_OBJECT_BODY, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    EditorNavigation.SelectEntityByName("Button1", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Label", "SetStore");
    cy.get(".action-block-tree").click({ force: true });
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecuteInExistingActionBlock(
        jsObj,
        "setStore",
      );
    });

    EditorNavigation.SelectEntityByName("Button2", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Label", "ShowStore");
    cy.get(".action-block-tree").click({ force: true });
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecuteInExistingActionBlock(
        jsObj,
        "showStore",
      );
    });

    deployMode.DeployApp();
    agHelper.ClickButton("SetStore");
    agHelper.ValidateToastMessage(JSON.stringify(TEST_OBJECT), 0, 1);
    agHelper.ValidateToastMessage(JSON.stringify(TEST_OBJECT.two), 1, 2);
    agHelper.ValidateToastMessage(`{"b":2}`, 2, 3);

    agHelper.ClickButton("ShowStore");
    agHelper.ValidateToastMessage(JSON.stringify(TEST_OBJECT), 0);
    deployMode.NavigateBacktoEditor();
  });

  it("4. Bug 24882. StoreValue, removeValue and clearStore should emit platform generated logs", function () {
    const jsObjectBody = `export default {
      storeFns: () => {
        storeValue("xyz", 123);
        removeValue("xyz");
        clearStore();
      }
    }`;

    jsEditor.CreateJSObject(jsObjectBody, {
      paste: true,
      completeReplace: true,
      toRun: true,
      shouldCreateNewJSObj: true,
    });

    entityExplorer.DragDropWidgetNVerify("buttonwidget", 400, 400);
    EditorNavigation.SelectEntityByName("Button3", EntityType.Widget);
    propPane.UpdatePropertyFieldValue("Label", "Test store logs");
    cy.get("@jsObjName").then((jsObj: any) => {
      propPane.SelectJSFunctionToExecute(
        "onClick",
        jsObj as string,
        "storeFns",
      );
    });
    agHelper.ClickButton("Test store logs");

    debuggerHelper.OpenDebugger();
    debuggerHelper.ClickLogsTab();
    debuggerHelper.changeLogsGroup("System logs");
    debuggerHelper.DoesConsoleLogExist("storeValue('xyz', '123', true)");
    debuggerHelper.DoesConsoleLogExist("removeValue('xyz')");
    debuggerHelper.DoesConsoleLogExist("clearStore()");
  });
});
