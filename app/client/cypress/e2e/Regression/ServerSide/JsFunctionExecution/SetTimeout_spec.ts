import {
  dataManager,
  jsEditor,
  agHelper,
  apiPage,
  deployMode,
  debuggerHelper,
} from "../../../../support/Objects/ObjectsCore";

let userName: string;

describe(
  "Tests setTimeout API",
  { tags: ["@tag.JS", "@tag.Binding"] },
  function () {
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
    it("4. Verifies code execution order when using setTimeout", () => {
      jsEditor.CreateJSObject(
        `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            console.log("Hey there!");
            setTimeout(() => console.log("Working!"), 4000);
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
      jsEditor.RunJSObj();
      agHelper.GetNClick(jsEditor._logsTab);
      debuggerHelper.DoesConsoleLogExist("Hey there!");
      debuggerHelper.DoesConsoleLogExist("Bye!");
      debuggerHelper.DoesConsoleLogExist("Working!", false);
      agHelper.Sleep(4000);
      debuggerHelper.DoesConsoleLogExist("Working!");
    });

    it("5. Resolves promise after 3 seconds and shows alert", () => {
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

    it("6. Access to args passed into success/error callback functions in API.run when using setTimeout", () => {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].mockApiUrl,
      );
      jsEditor.CreateJSObject(
        `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            Api1.run((res) => {
              setTimeout(() => {
                showAlert(res[0].name);
              }, 3000);
            }, (error) => {
              console.log(error);
            });
        },
        myFun2: (x) => {
          Api1.run().then((res) => {
            setTimeout(() => {
              showAlert(res[0].name);
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

      cy.wait("@postExecute").then((interception: any) => {
        //Js function to match any name returned from API
        userName = JSON.stringify(
          interception.response.body.data.body[0].name,
        ).replace(/['"]+/g, ""); //removing double quotes
        agHelper.AssertContains(userName);
      });

      agHelper.Sleep(2000);
      jsEditor.SelectFunctionDropdown("myFun2");
      jsEditor.RunJSObj();
      agHelper.Sleep(3000);
      cy.wait("@postExecute").then((interception: any) => {
        userName = JSON.stringify(
          interception.response.body.data.body[0].name,
        ).replace(/['"]+/g, "");
        agHelper.AssertContains(userName);
      });
    });

    it("7. Verifies whether setTimeout executes on page load", () => {
      jsEditor.CreateJSObject(
        `export default {
        myVar1: [],
        myVar2: {},
        myFun1: (x) => {
            setTimeout(() => {
              showAlert("Success!");
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
      jsEditor.EnableDisableAsyncFuncSettings("myFun1", "On page load");
      deployMode.DeployApp();
      agHelper.Sleep(1000); //DeployApp already waiting 2000ms hence reducing it here to equate to 3000 timeout
      agHelper.AssertContains("Success!");
      agHelper.Sleep(1000);
      cy.wait("@postExecute").then((interception: any) => {
        userName = JSON.stringify(
          interception.response.body.data.body[0].name,
        ).replace(/['"]+/g, "");
        agHelper.AssertContains(userName);
      });
    });
  },
);
