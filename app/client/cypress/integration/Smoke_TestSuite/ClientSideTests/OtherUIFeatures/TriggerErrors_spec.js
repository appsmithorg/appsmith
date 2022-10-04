const dsl = require("../../../../fixtures/debuggerTableDsl.json");
const debuggerLocators = require("../../../../locators/Debugger.json");
var appId = " ";

describe("Trigger errors in the debugger", function() {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });
  it("Trigger errors need to be shown in the errors tab", function() {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", `[{"name": 1}, {"name": 2}]`);
    cy.get(".t--property-control-onrowselected")
      .find(".t--js-toggle")
      .click();
    cy.EnableAllCodeEditors();
    cy.testJsontext("onrowselected", "{{console.logs('test')}}");
    // Click on a row of the table widget
    cy.isSelectRow(1);
    cy.wait(5000);
    cy.contains(debuggerLocators.errorCount, 2);
    // Fix code
    cy.testJsontext("onrowselected", "{{console.log('test')}}");
    cy.isSelectRow(1);
    cy.contains(debuggerLocators.errorCount, 1);
  });
});
