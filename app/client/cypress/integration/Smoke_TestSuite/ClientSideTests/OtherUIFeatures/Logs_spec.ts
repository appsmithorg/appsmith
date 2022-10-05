const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  Debugger: _debugger,
  EntityExplorer: ee,
  JSEditor: jsEditor,
  PropertyPane: propPane,
} = ObjectsRegistry;

let logString;
let dataSet;

const generateTestLogString = () => {
  const randString = Cypress._.random(0, 1e4);
  const logString = `Test ${randString}`;
  return logString;
};

describe("Debugger logs", function() {
  before(() => {
    cy.fixture("testdata").then(function(data) {
      dataSet = data;
    });
  });
  this.beforeEach(() => {
    logString = generateTestLogString();
  });

  it("1. Modifying widget properties should log the same", function() {
    ee.DragDropWidgetNVerify("buttonwidget", 200, 200);
    propPane.UpdatePropertyFieldValue("Label", "Test");
    _debugger.clickDebuggerIcon(0, true, 0);
    _debugger.logStateContains("Test");
  });

  it("2. Reset debugger state", function() {
    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.testJsontext("visible", "Test");
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.generateUUID().then((id) => {
      cy.CreateAppInFirstListedWorkspace(id);
      _debugger.isErrorCount(0);
    });
  });

  it("3. Console log on button click with normal moustache binding", function() {
    ee.DragDropWidgetNVerify("buttonwidget", 200, 200);
    // Testing with normal log in moustache binding
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    _debugger.clickDebuggerIcon();
    _debugger.doesConsoleLogExist(logString);
  });

  it("4. Console log on button click with arrow function IIFE", function() {
    _debugger.clearLogs();
    ee.SelectEntityByName("Button1");
    // Testing with normal log in iifee
    propPane.EnterJSContext(
      "onClick",
      `{{(() => {
          console.log('${logString}');
        }) () }}`,
    );
    agHelper.ClickButton("Submit");
    _debugger.doesConsoleLogExist(logString);
  });

  it("5. Console log on button click with function keyword IIFE", function() {
    _debugger.clearLogs();
    ee.SelectEntityByName("Button1");
    // Testing with normal log in iifee
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    _debugger.doesConsoleLogExist(logString);
  });

  it("6. Console log on button click with async function IIFE", function() {
    _debugger.clearLogs();
    // Testing with normal log in iifee
    ee.SelectEntityByName("Button1");
    propPane.EnterJSContext(
      "onClick",
      `{{(async() => {
          console.log('${logString}');
        }) () }}`,
    );
    agHelper.ClickButton("Submit");
    _debugger.doesConsoleLogExist(logString);
  });

  it("7. Console log on button click with mixed function IIFE", function() {
    _debugger.clearLogs();
    // Testing with normal log in iifee
    ee.SelectEntityByName("Button1");
    const logStringChild = generateTestLogString();
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          (async () => {console.log('${logStringChild}')})();
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    _debugger.doesConsoleLogExist(logString);
    _debugger.doesConsoleLogExist(logStringChild);
  });

  it("8. Console log grouping on button click", function() {
    _debugger.clearLogs();
    // Testing with normal log in iifee
    ee.SelectEntityByName("Button1");
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          console.log('${logString}');
          console.log('${logString}');
          console.log('${logString}');
          console.log('${logString}');
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    _debugger.doesConsoleLogExist(logString);
    _debugger.is_Consecutive_Console_Log_Count(5);
  });

  it("9. Console log grouping on button click with different log in between", function() {
    _debugger.clearLogs();
    // Testing with normal log in iifee
    ee.SelectEntityByName("Button1");
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          console.log('${logString}');
          console.log('Different ${logString}');
          console.log('${logString}');
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    _debugger.doesConsoleLogExist(logString);
    _debugger.doesConsoleLogExist(`Different ${logString}`);
    _debugger.is_Consecutive_Console_Log_Count(2);
  });

  it("10. Console log grouping on button click from different source", function() {
    _debugger.clearLogs();
    // Testing with normal log in iifee
    ee.SelectEntityByName("Button1");
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    // Add another button
    ee.DragDropWidgetNVerify("buttonwidget", 400, 200);
    propPane.UpdatePropertyFieldValue("Label", "Submit2");
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.ClickButton("Submit2");
    _debugger.doesConsoleLogExist(logString);
    _debugger.is_Consecutive_Console_Log_Count(0);
  });

  it("11. Console log on text widget with normal moustache binding", function() {
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
    agHelper.AssertElementVisible(".t--debugger");
    _debugger.clickDebuggerIcon();
    _debugger.doesConsoleLogExist(logString);
  });

  it("12. Console log in sync function", function() {
    ee.NavigateToSwitcher("explorer");
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
    _debugger.doesConsoleLogExist(logString);
  });

  it("13. Console log in async function", function() {
    ee.NavigateToSwitcher("explorer");
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
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.GetNClick(jsEditor._logsTab);
    _debugger.doesConsoleLogExist(logString);
  });

  it("14. Console log after API succedes", function() {
    ee.NavigateToSwitcher("explorer");
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
    agHelper.WaitUntilAllToastsDisappear();

    cy.get("@jsObjName").then((jsObjName) => {
      agHelper.GetNClick(jsEditor._runButton);
      agHelper.GetNClick(jsEditor._logsTab);
      _debugger.doesConsoleLogExist(`${logString} Started`);
      _debugger.doesConsoleLogExist(`${logString} Success`);
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

  it("15. Console log after API execution fails", function() {
    ee.NavigateToSwitcher("explorer");
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
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.GetNClick(jsEditor._logsTab);
    _debugger.doesConsoleLogExist(`${logString} Started`);
    _debugger.doesConsoleLogExist(`${logString} Failed`);
  });

  it("16. Console log source inside nested function", function() {
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
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.GetNClick(jsEditor._logsTab);
    _debugger.doesConsoleLogExist(`Parent ${logString}`);
    _debugger.doesConsoleLogExist(`Child ${logString}`);
  });

  it("17. Console log grouping", function() {
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
    agHelper.WaitUntilAllToastsDisappear();
    agHelper.GetNClick(jsEditor._runButton);
    agHelper.GetNClick(jsEditor._logsTab);
    _debugger.doesConsoleLogExist(`${logString}`);
    _debugger.is_Consecutive_Console_Log_Count(5);
  });

  // it("Api headers need to be shown as headers in logs", function() {
  //   // TODO
  // });

  // it("Api body needs to be shown as JSON when possible", function() {
  //   // TODO
  // });
});
