import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const jsEditor = ObjectsRegistry.JSEditor,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage,
  agHelper = ObjectsRegistry.AggregateHelper;

describe("Linting", () => {
  before(() => {
    ee.DragDropWidgetNVerify("buttonwidget", 300, 300);
    ee.NavigateToSwitcher("explorer");
  });
  it("Shows correct lint error when Api is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{Api1.run(() => showAlert('success','success'), () => showAlert('error','error'))}}`,
      true,
      true,
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementExist(locator._lintErrorElement);
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementExist(locator._lintErrorElement);
  });
  it("Shows correct lint error when Api is renamed", () => {
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.SelectEntityByName("Api1", "QUERIES/JS");
    agHelper.RenameWithInPane("Api2");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.SelectEntityByName("Api2", "QUERIES/JS");
    agHelper.RenameWithInPane("Api1");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
  it("Shows correct lint error when JSObject is deleted or created", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext("onClick", `{{JSObject1.myFun1()}}`, true, true);
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementExist(locator._lintErrorElement);
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: () => {
            //write code here
        },
        myFun2: async () => {
            //use async-await or promises
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementExist(locator._lintErrorElement);
  });
  it("Shows correct lint error when JSObject is renamed", () => {
    jsEditor.CreateJSObject(
      `export default {
          myVar1: [],
          myVar2: {},
          myFun1: () => {
              //write code here
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.SelectEntityByName("JSObject1", "QUERIES/JS");
    agHelper.RenameWithInPane("JSObject2");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.SelectEntityByName("JSObject2", "QUERIES/JS");
    agHelper.RenameWithInPane("JSObject1");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
  it("Shows correct lint error with multiple entities in triggerfield", () => {
    ee.SelectEntityByName("Button1", "WIDGETS");
    jsEditor.EnterJSContext(
      "onClick",
      `{{Api1.run(), JSObject1.myFun1(), JSObject1.myFun2()}}`,
      true,
      true,
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);

    ee.ActionContextMenuByEntityName("JSObject1", "Delete", "Are you sure?");
    ee.ActionContextMenuByEntityName("Api1", "Delete", "Are you sure?");

    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementExist(locator._lintErrorElement);

    jsEditor.CreateJSObject(
      `export default {
          myVar1: [],
          myVar2: {},
          myFun1: () => {
              //write code here
          },
          myFun2: async () => {
              //use async-await or promises
          }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    apiPage.CreateAndFillApi(
      "https://jsonplaceholder.typicode.com/",
      "Api1",
      "GET",
    );
    ee.SelectEntityByName("Button1", "WIDGETS");
    agHelper.AssertElementAbsence(locator._lintErrorElement);
  });
});
