const dsl = require("../../../../fixtures/Invalid_binding_dsl.json");
const testdata = require("../../../../fixtures/testdata.json");
import { entityExplorer } from "../../../../support/Objects/ObjectsCore";

describe("Binding the multiple widgets and validating default data", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Dropdown widget test with invalid binding value", function () {
    entityExplorer.SelectEntityByName("Dropdown1");
    cy.testJsontext("options", JSON.stringify(testdata.defaultdataBinding));
    cy.evaluateErrorMessage(testdata.dropdownErrorMsg);
    //Table widget test with invalid binding value
    entityExplorer.SelectEntityByName("Table1");
    cy.testJsontext("tabledata", JSON.stringify(testdata.defaultdataBinding));
    cy.evaluateErrorMessage(testdata.tableWidgetErrorMsg);
  });
});
