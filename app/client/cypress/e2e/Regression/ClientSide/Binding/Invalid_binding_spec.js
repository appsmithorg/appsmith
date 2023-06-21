const testdata = require("../../../../fixtures/testdata.json");
import {
  entityExplorer,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Binding the multiple widgets and validating default data", function () {
  before(() => {
    cy.fixture("Invalid_binding_dsl").then((val) => {
      agHelper.AddDsl(val);
    });
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
