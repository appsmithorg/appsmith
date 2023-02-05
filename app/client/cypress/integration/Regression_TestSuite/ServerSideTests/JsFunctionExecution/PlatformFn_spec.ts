import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;
const jsEditor = ObjectsRegistry.JSEditor;
const apiPage = ObjectsRegistry.ApiPage;

describe("Tests functionality of platform function", () => {
  it("1. Tests access to outer variable", () => {
    apiPage.CreateAndFillApi(
      "https://mock-api.appsmith.com/users",
      "getAllUsers",
    );
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
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
    agHelper.Sleep(2000);
    jsEditor.RunJSObj();
    agHelper.AssertContains("Hello World from success callback", "exist");
    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.AssertContains("Hello World from setInterval", "exist");
    // jsEditor.SelectFunctionDropdown("myFun3");
    // jsEditor.RunJSObj();
    // agHelper.AssertContains("Hello World from current position", "exist");
  });
});
