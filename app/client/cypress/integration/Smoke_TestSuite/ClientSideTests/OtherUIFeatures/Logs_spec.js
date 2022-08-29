const dsl = require("../../../../fixtures/buttondsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const debuggerLocators = require("../../../../locators/Debugger.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const {
  EntityExplorer: ee,
  JSEditor: jsEditor,
  PropertyPane: propPane,
} = ObjectsRegistry;

const generateTestLogString = () => {
  const randString = Cypress._.random(0, 1e4);
  const logString = `Test ${randString}`;
  return logString;
};

describe("Debugger logs", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Modifying widget properties should log the same", function() {
    cy.wait(5000);
    cy.get("button")
      .contains("Submit")
      .click({ force: true });
    cy.openPropertyPane("buttonwidget");
    cy.testJsontext("label", "Test");
    cy.get(debuggerLocators.debuggerIcon).click();
    cy.get(debuggerLocators.debuggerLogState).contains("Test");
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
    ee.DragDropWidgetNVerify("buttonwidget", 100, 200);
    // Testing with normal log in moustache binding
    cy.openPropertyPane("buttonwidget");
    const logString = generateTestLogString();
    propPane.EnterJSContext("onClick", `{{console.log("${logString}")}}`);
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.get("button")
      .contains("Submit")
      .click({ force: true });
    cy.get(debuggerLocators.debuggerIcon).click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
  });

  it("4. Console log on button click with arrow function IIFE", function() {
    // Testing with normal log in iifee
    cy.get(debuggerLocators.debuggerClearLogs).click();
    cy.openPropertyPane("buttonwidget");
    const logString = generateTestLogString();
    propPane.EnterJSContext(
      "onClick",
      `{{(() => {
          console.log('${logString}');
        }) () }}`,
    );
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.get("button")
      .contains("Submit")
      .click({ force: true });
    cy.get(debuggerLocators.debuggerLogMessage)
      .first()
      .click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
  });

  it("5. Console log on button click with function keyword IIFE", function() {
    // Testing with normal log in iifee
    cy.get(debuggerLocators.debuggerClearLogs).click();
    cy.openPropertyPane("buttonwidget");
    const logString = generateTestLogString();
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
        } () }}`,
    );
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.get("button")
      .contains("Submit")
      .click({ force: true });
    cy.get(debuggerLocators.debuggerLogMessage)
      .first()
      .click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
  });

  it("6. Console log on button click with async function IIFE", function() {
    // Testing with normal log in iifee
    cy.get(debuggerLocators.debuggerClearLogs).click();
    cy.openPropertyPane("buttonwidget");
    const logString = generateTestLogString();
    propPane.EnterJSContext(
      "onClick",
      `{{(async() => {
          console.log('${logString}');
        }) () }}`,
    );
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.get("button")
      .contains("Submit")
      .click({ force: true });
    cy.get(debuggerLocators.debuggerLogMessage)
      .first()
      .click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
  });

  it("7. Console log on button click with mixed function IIFE", function() {
    // Testing with normal log in iifee
    cy.get(debuggerLocators.debuggerClearLogs).click();
    cy.openPropertyPane("buttonwidget");
    const logString = generateTestLogString();
    const logStringChild = generateTestLogString();
    propPane.EnterJSContext(
      "onClick",
      `{{ function () {
          console.log('${logString}');
          (async () => {console.log('${logStringChild}')})();
        } () }}`,
    );
    // Clicking outside to trigger the save
    cy.get("body").click(0, 0);
    cy.get("button")
      .contains("Submit")
      .click({ force: true });
    cy.get(debuggerLocators.debuggerLogMessage)
      .first()
      .click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
    cy.get(debuggerLocators.debuggerLogMessage).contains(logStringChild);
  });

  it("8. Console log in sync function", function() {
    ee.NavigateToSwitcher("explorer");
    const logString = generateTestLogString();
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
    cy.get("[data-cy=t--tab-LOGS_TAB]").click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
  });

  it("9. Console log in async function", function() {
    ee.NavigateToSwitcher("explorer");
    const logString = generateTestLogString();
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
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: false,
      },
    );
    cy.get("[data-cy=t--tab-LOGS_TAB]").click();
    cy.get(debuggerLocators.debuggerLogMessage).contains(logString);
  });

  it("Api headers need to be shown as headers in logs", function() {
    // TODO
  });

  it("Api body needs to be shown as JSON when possible", function() {
    // TODO
  });
});
