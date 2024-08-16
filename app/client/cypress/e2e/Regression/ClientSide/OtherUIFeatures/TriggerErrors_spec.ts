import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Trigger errors in the debugger", function () {
  before(() => {
    _.agHelper.AddDsl("debuggerTableDsl");
  });
  it("1. Trigger errors need to be shown in the errors tab", function () {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", `[{"name": 1}, {"name": 2}]`);
    cy.focused().blur();
    cy.get(".t--property-control-onrowselected").find(".t--js-toggle").click();
    cy.EnableAllCodeEditors();
    cy.testJsontext("onrowselected", "{{console.logs('test')}}");
    // Click on a row of the table widget
    _.table.SelectTableRow(1);
    //should be 2 if we decide to show trigger errors in the debugger.
    _.debuggerHelper.AssertErrorCount(1);
    // Fix code
    cy.testJsontext("onrowselected", "{{console.log('test')}}");
    _.table.SelectTableRow(1);
    _.debuggerHelper.AssertErrorCount(1);
  });
});
