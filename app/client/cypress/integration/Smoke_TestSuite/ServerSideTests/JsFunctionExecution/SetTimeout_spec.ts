import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const jsEditor = ObjectsRegistry.JSEditor;
const agHelper = ObjectsRegistry.AggregateHelper;
const apiPage = ObjectsRegistry.ApiPage;
const deployMode = ObjectsRegistry.DeployMode;
const debuggerHelper = ObjectsRegistry.DebuggerHelper;

describe("Tests setTimeout API", function() {
  it("1. Executes showAlert after 3 seconds and uses default value", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x = "default") => {
            setTimeout(() => {
                showAlert("Hello world - " + x);
            }, 3000);
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("Hello world - default", "exist");
  });

  it("2. Executes all three alerts in parallel after 3 seconds", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x = "default") => {
            setTimeout(() => {
                showAlert("Hello world - " + x);
            }, 3000);
        },
        myFun2: () => {
            this.myFun1(1)
            this.myFun1(2)
            this.myFun1(3)
        }
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("Hello world - 1", "exist");
    agHelper.AssertContains("Hello world - 2", "exist");
    agHelper.AssertContains("Hello world - 3", "exist");
  });

  it("3. Resolves promise after 3 seconds and shows alert", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            new Promise((res, rej) => setTimeout(() => res("resolved"), 3000)).then((res) => {
                showAlert(res);
            });
        },
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("resolved");
  });
  it("verifies code execution order when using setTimeout", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            console.log("Hey there!");
            setTimeout(() => console.log("Working!"), 3000);
            console.log("Bye!");
        },
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    debuggerHelper.ClickDebuggerIcon();
    agHelper.GetNClick(jsEditor._logsTab);
    jsEditor.RunJSObj();
    debuggerHelper.DoesConsoleLogExist("Hey there!");
    debuggerHelper.DoesConsoleLogExist("Bye!");
    debuggerHelper.DoesConsoleLogExist("Working!", false, undefined, 100);
    agHelper.Sleep(3000);
    debuggerHelper.DoesConsoleLogExist("Working!");
  });

  it("4. Resolves promise after 3 seconds and shows alert", () => {
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            new Promise((res, rej) => setTimeout(() => res("resolved"), 3000)).then((res) => {
                showAlert(res);
            });
        },
    }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    agHelper.Sleep(2000);
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("resolved");
  });

  it("5. Access to args passed into success/error callback functions in API.run when using setTimeout", () => {
    apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            Api1.run((res) => {
              setTimeout(() => {
                showAlert(res.users[0].name);
              }, 3000);
            }, (error) => {
              console.log(error);
            });
        },
        myFun2: (x) => {
          Api1.run().then((res) => {
            setTimeout(() => {
              showAlert(res.users[0].name);
            }, 3000);
          });
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    jsEditor.RenameJSObjFromPane("Timeouts");
    agHelper.Sleep(2000);
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("Barty Crouch");
    agHelper.Sleep(2000);
    jsEditor.SelectFunctionDropdown("myFun2");
    jsEditor.RunJSObj();
    agHelper.Sleep(3000);
    agHelper.AssertContains("Barty Crouch");
  });

  it("6. Verifies whether setTimeout executes on page load", () => {
    apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users");
    jsEditor.CreateJSObject(
      `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            setTimeout(() => {
              Api1.run().then(() => showAlert("Success!"));
              Timeouts.myFun2();
            }, 3000)
        },
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      },
    );
    jsEditor.EnableDisableAsyncFuncSettings("myFun1", true, false);
    deployMode.DeployApp();
    agHelper.Sleep(3000);
    agHelper.AssertContains("Success!");
    agHelper.Sleep(3000);
    agHelper.AssertContains("Barty Crouch");
  });
});
