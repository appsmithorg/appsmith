const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableNewDslWithPagination.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget property pane feature validation", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Verify table column type changes effect on menuButton and iconButton", function () {
    cy.openPropertyPane("tablewidget");
    cy.addColumn("CustomColumn");
    _.table.ChangeColumnType("customColumn1", "Menu button", "v1");
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
    cy.getTableDataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("not.exist");
    });

    cy.changeColumnType("Icon button", false);
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "add");
    cy.getTableDataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon-add").should("exist");
    });

    cy.changeColumnType("Menu button", false);
    cy.wait(500);
    cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
    cy.getTableDataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("not.exist");
    });

    cy.closePropertyPane();
  });
});
