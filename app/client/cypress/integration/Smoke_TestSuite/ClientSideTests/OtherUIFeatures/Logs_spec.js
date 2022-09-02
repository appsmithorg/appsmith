const commonlocators = require("../../../../locators/commonlocators.json");
const debuggerLocators = require("../../../../locators/Debugger.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  AggregateHelper: agHelper,
  ApiPage: apiPage,
  CommonLocators: locator,
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
    agHelper.GetNClick(locator._debuggerIcon, 0, true, 0);
    agHelper.GetNAssertContains(locator._debuggerLogState, "Test");
  });

  it("2. Reset debugger state", function() {
    cy.get(".t--property-control-visible")
      .find(".t--js-toggle")
      .click();
    cy.testJsontext("visible", "Test");
    cy.get(commonlocators.homeIcon).click({ force: true });
    cy.generateUUID().then((id) => {
      cy.CreateAppInFirstListedWorkspace(id);
      cy.get(debuggerLocators.errorCount).should("not.exist");
    });
  });

  it("3. Console log on button click with normal moustache binding", function() {
    ee.DragDropWidgetNVerify("buttonwidget", 200, 200);
    // Testing with normal log in moustache binding
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    agHelper.Sleep(2000);
    agHelper.ClickButton("Submit");
    agHelper.GetNClick(locator._debuggerIcon);
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
  });

  it("4. Console log on button click with arrow function IIFE", function() {
    agHelper.GetNClick(locator._debuggerClearLogs);
    ee.SelectEntityByName("Button1");
    // Testing with normal log in iifee
    propPane.EnterJSContext(
      "onClick",
      `{{(() => {
          console.log('${logString}');
        }) () }}`,
    );
    agHelper.ClickButton("Submit");
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
  });

  it("5. Console log on button click with function keyword IIFE", function() {
    agHelper.GetNClick(locator._debuggerClearLogs);
    ee.SelectEntityByName("Button1");
    // Testing with normal log in iifee
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
        } () }}`,
    );
    agHelper.ClickButton("Submit");
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
  });

  it("6. Console log on button click with async function IIFE", function() {
    agHelper.GetNClick(locator._debuggerClearLogs);
    // Testing with normal log in iifee
    ee.SelectEntityByName("Button1");
    propPane.EnterJSContext(
      "onClick",
      `{{(async() => {
          console.log('${logString}');
        }) () }}`,
    );
    agHelper.ClickButton("Submit");
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
  });

  it("7. Console log on button click with mixed function IIFE", function() {
    agHelper.GetNClick(locator._debuggerClearLogs);
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
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logStringChild);
  });

  it("8. Console log in sync function", function() {
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
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
  });

  it("9. Console log in async function", function() {
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
    agHelper.GetNAssertContains(locator._debuggerLogMessage, logString);
  });

  it("10. Console log after API succedes", function() {
    ee.NavigateToSwitcher("explorer");
    apiPage.CreateAndFillApi(dataSet.baseUrl + dataSet.methods, "Test1");
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          return Test1.run().then(()=>{
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
    agHelper.GetNAssertContains(
      locator._debuggerLogMessage,
      `${logString} Success`,
    );
  });

  it("11. Console log after API execution fails", function() {
    ee.NavigateToSwitcher("explorer");
    apiPage.CreateAndFillApi(
      dataSet.baseUrl + dataSet.methods + "xyz",
      "Test2",
    );
    jsEditor.CreateJSObject(
      `export default {
        myFun1: async () => {
          return Test2.run().then(()=>{
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
    agHelper.GetNAssertContains(
      locator._debuggerLogMessage,
      `${logString} Failed`,
    );
  });

  // it("Api headers need to be shown as headers in logs", function() {
  //   // TODO
  // });

  // it("Api body needs to be shown as JSON when possible", function() {
  //   // TODO
  // });
});
