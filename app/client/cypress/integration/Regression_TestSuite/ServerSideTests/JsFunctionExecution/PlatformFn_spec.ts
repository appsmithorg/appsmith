import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
const jsEditor = ObjectsRegistry.JSEditor;
const apiPage = ObjectsRegistry.ApiPage;
const debuggerHelper = ObjectsRegistry.DebuggerHelper;

describe("Tests functionality of platform function", () => {
  it("1. Tests access to outer variable", () => {
    apiPage.CreateAndFillApi(
      "https://mock-api.appsmith.com/users",
      "getAllUsers",
    );
    jsEditor.CreateJSObject(
      `export default {
      myFun1: () => {
        const outer = "World";
        getAllUsers.run(() => {
          showAlert("Hello " + outer + " from success callback");
        });
      },
      myFun2: async () => {
        const outer = "World";
        setInterval(() => {
          showAlert("Hello " + outer +" from setInterval");
          clearInterval("test");
        }, 1000, "test")
      },
      myFun3: async () => {
        const outer = "World";
        appsmith.geolocation.getCurrentPosition(() => {
          showAlert("Hello " + outer+ " from current position");
        });
      },
      metaDataForSetInterval: () => {
        setInterval(() => {
          console.log("Hello from setInterval");
          clearInterval("test345")
        }, 3000, "test345");
      },
      metaDataForSetTimeout: () => {
        setTimeout(() => {
          console.log("Hello from setTimeout");
        }, 4000);
      },
      switchMetaData: () => {},
      accessSetIntervalFromSetTimeout: () => {
        setTimeout(() => {
          setInterval(() => {
            showAlert("Hello World from setInterval inside setTimeout");
            clearInterval("test123");
          }, 1000, "test123");
        }, 1000);
      },
      executeTriggersOutsideReqResCycle: () => {
        showAlert("Hello").then(() => getAllUsers.run(() => showAlert("World")));
      }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    agHelper.Sleep(4000);
    jsEditor.SelectFunctionDropdown("myFun1");
    jsEditor.RunJSObj();
    agHelper.AssertContains("Hello World from success callback", "exist");
    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.AssertContains("Hello World from setInterval", "exist");
    // jsEditor.SelectFunctionDropdown("myFun3");
    // jsEditor.RunJSObj();
    // agHelper.AssertContains("Hello World from current position", "exist");
    jsEditor.SelectFunctionDropdown("accessSetIntervalFromSetTimeout");
    jsEditor.RunJSObj();
    agHelper.AssertContains(
      "Hello World from setInterval inside setTimeout",
      "exist",
    );
    jsEditor.SelectFunctionDropdown("executeTriggersOutsideReqResCycle");
    jsEditor.RunJSObj();
    agHelper.AssertContains("Hello", "exist");
    agHelper.AssertContains("World", "exist");

    // Test for meta data
    jsEditor.SelectFunctionDropdown("metaDataForSetTimeout");
    jsEditor.RunJSObj();
    debuggerHelper.ClickDebuggerIcon();
    agHelper.GetNClick(jsEditor._logsTab);
    jsEditor.SelectFunctionDropdown("switchMetaData");
    jsEditor.RunJSObj();
    agHelper.Sleep(4000);
    debuggerHelper.filter("JSObject1.metaDataForSetTimeout");
    debuggerHelper.DoesConsoleLogExist("Hello from setTimeout");

    jsEditor.SelectFunctionDropdown("metaDataForSetInterval");
    jsEditor.RunJSObj();
    debuggerHelper.ClickDebuggerIcon();
    agHelper.GetNClick(jsEditor._logsTab);
    jsEditor.SelectFunctionDropdown("switchMetaData");
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    debuggerHelper.filter("JSObject1.metaDataForSetInterval");
    debuggerHelper.DoesConsoleLogExist("Hello from setInterval");
  });
});
