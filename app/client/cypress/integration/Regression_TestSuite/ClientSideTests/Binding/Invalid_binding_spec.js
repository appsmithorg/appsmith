const dsl = require("../../../../fixtures/Invalid_binding_dsl.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Dropdown widget test with invalid binding value", function() {
    cy.openPropertyPane("selectwidget");
    cy.testJsontext("options", JSON.stringify(testdata.defaultdataBinding));
    cy.evaluateErrorMessage(testdata.dropdownErrorMsg);
  });

  it("Table widget test with invalid binding value", function() {
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", JSON.stringify(testdata.defaultdataBinding));
    cy.evaluateErrorMessage(testdata.tableWidgetErrorMsg);
  });
});
