import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const dsl = require("../../../../fixtures/debuggerTableDsl.json");
const debuggerHelper = ObjectsRegistry.DebuggerHelper;

describe("Trigger errors in the debugger", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Trigger errors need to be shown in the errors tab", function() {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", `[{"name": 1}, {"name": 2}]`);
    cy.focused().blur();
    cy.get(".t--property-control-onrowselected")
      .find(".t--js-toggle")
      .click();
    cy.EnableAllCodeEditors();
    cy.testJsontext("onrowselected", "{{console.logs('test')}}");
    // Click on a row of the table widget
    cy.isSelectRow(1);
    cy.wait(5000);
    //should be 2 if we decide to show trigger errors in the debugger.
    debuggerHelper.AssertErrorCount(1);
    // Fix code
    cy.testJsontext("onrowselected", "{{console.log('test')}}");
    cy.isSelectRow(1);
    debuggerHelper.AssertErrorCount(1);
  });
});
