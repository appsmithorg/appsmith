const testdata = require("../../../../fixtures/testdata.json");
import * as _ from "../../../../support/Objects/ObjectsCore";

describe("Binding the multiple widgets and validating default data", function () {
  before(() => {
    cy.fixture("Invalid_binding_dsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("1. Dropdown widget test with invalid binding value", function () {
    cy.openPropertyPane("selectwidget");
    cy.testJsontext("options", JSON.stringify(testdata.defaultdataBinding));
    cy.evaluateErrorMessage(testdata.dropdownErrorMsg);
    //Table widget test with invalid binding value
    cy.openPropertyPane("tablewidget");
    cy.testJsontext("tabledata", JSON.stringify(testdata.defaultdataBinding));
    cy.evaluateErrorMessage(testdata.tableWidgetErrorMsg);
  });
});
