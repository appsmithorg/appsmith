import commonlocators from "../../../../locators/commonlocators.json";
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const locator = ObjectsRegistry.CommonLocators;

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  DebuggerHelper: debuggerHelper,
  EntityExplorer: ee,
  JSEditor: jsEditor,
  PropertyPane: propPane,
} = ObjectsRegistry;

let logString, dataSet;

const generateTestLogString = () => {
  const randString = Cypress._.random(0, 1e4);
  const logString = `Test ${randString}`;
  return logString;
};

describe("Debugger logs", function () {
  before(() => {
    cy.fixture("testdata").then(function (data) {
      dataSet = data;
    });
  });
  this.beforeEach(() => {
    logString = generateTestLogString();
  });

  it("1. Console log on text widget with normal moustache binding", function () {
    ee.NavigateToSwitcher("Widgets");
    agHelper.TypeText(locator._entityExplorersearch, "Text");
    ee.DragDropWidgetNVerify("textwidget", 400, 400);
    propPane.UpdatePropertyFieldValue(
      "Text",
      `{{(function(){
  	const temp = "Hello!"

  	console.log("${logString}");
  	return temp;
  })()}}`,
    );
    agHelper.RefreshPage();
    // Wait for the debugger icon to be visible
    agHelper.AssertElementVisible(".t--debugger-count");
    debuggerHelper.ClickDebuggerIcon();
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("2. Console log in sync function", function () {
    ee.NavigateToSwitcher("Explorer");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: () => {
  	      console.log("${logString}");
  	      return "sync";
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("3. Console log in async function", function () {
    ee.NavigateToSwitcher("Explorer");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
  	      console.log("${logString}");
  	      return "async";
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
        prettify: false,
      },
    );

    // Edit JSObject and verify no logs are visible
    jsEditor.EditJSObj(`export default {
      myFun1: async () => {
        console.log("${logString}");
        return "async";
      },
      myFun2: () => {
        return 2;
      }
    }`);
    debuggerHelper.DoesConsoleLogExist(logString, false);

    // Run function and verify logs are visible
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(logString);
  });

  it("4. Console log after API succedes", function () {
    ee.NavigateToSwitcher("Explorer");
    apiPage.CreateAndFillApi(dataSet.baseUrl + dataSet.methods, "Api1");
    const returnText = "success";
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          return storeValue("test", "test").then(() => {
            console.log("${logString} Started");
            return Api1.run().then(()=>{
              console.log("${logString} Success");
              return "${returnText}";
            }).catch(()=>{
              console.log("${logString} Failed");
              return "fail";
            });
          });
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );

    cy.get("@jsObjName").then((jsObjName) => {
      agHelper.Sleep(2000);
      jsEditor.RunJSObj();
      agHelper.GetNClick(jsEditor._logsTab);
      debuggerHelper.DoesConsoleLogExist(`${logString} Started`);
      debuggerHelper.DoesConsoleLogExist(`${logString} Success`);
      ee.DragDropWidgetNVerify("textwidget", 200, 600);
      propPane.UpdatePropertyFieldValue("Text", `{{${jsObjName}.myFun1.data}}`);
      agHelper.GetNAssertElementText(
        commonlocators.textWidgetContainer,
        returnText,
        "have.text",
        1,
      );
    });
  });

  it("5. Console log after API execution fails", function () {
    ee.NavigateToSwitcher("Explorer");
    apiPage.CreateAndFillApi(dataSet.baseUrl + dataSet.methods + "xyz", "Api2");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          console.log("${logString} Started");
          return Api2.run().then(()=>{
            console.log("${logString} Success");
            return "success";
          }).catch(()=>{
            console.log("${logString} Failed");
            return "fail";
          });
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.RunJSObj();
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(`${logString} Started`);
    debuggerHelper.DoesConsoleLogExist(`${logString} Failed`);
  });

  it("6. Console log source inside nested function", function () {
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          console.log("Parent ${logString}");
          return Api1.run(()=>{console.log("Child ${logString}");});
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: false,
      },
    );
    jsEditor.RunJSObj();
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(`Parent ${logString}`);
    debuggerHelper.DoesConsoleLogExist(`Child ${logString}`);
  });

  it("7. Console log grouping", function () {
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          console.log("${logString}");
          console.log("${logString}");
          console.log("${logString}");
          console.log("${logString}");
          console.log("${logString}");
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
      },
    );
    jsEditor.RunJSObj();
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist(`${logString}`);
    debuggerHelper.Assert_Consecutive_Console_Log_Count(5);
  });

  it("8. Console log should not mutate the passed object", function () {
    ee.NavigateToSwitcher("Explorer");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: () => {
  	      let data = [];
          console.log("start:", data);
          for(let i=0; i<5; i++)
            data.push(i);
          console.log("end:", JSON.stringify(data));
          return data;
        },
        myFun2: () => {
          return 1;
        }
      }`,
      {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    agHelper.GetNClick(jsEditor._logsTab);
    debuggerHelper.DoesConsoleLogExist("start: []");
    debuggerHelper.DoesConsoleLogExist("end: [0,1,2,3,4]");
  });

  it("9. Bug #19115 - Objects that start with an underscore `_JSObject1` fail to be navigated from the debugger", function () {
    const JSOBJECT_WITH_UNNECCESARY_SEMICOLON = `export default {
        myFun1: () => {
            //write code here
            if (1) {
                return true;;
            };
        }
    }
    `;

    jsEditor.CreateJSObject(JSOBJECT_WITH_UNNECCESARY_SEMICOLON, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
    });

    ee.SelectEntityByName("Page1", "Pages");
    agHelper.GetNClick(locator._errorTab);

    debuggerHelper.ClicklogEntityLink(0);

    cy.get(".t--js-action-name-edit-field").should("exist");
  });
});
