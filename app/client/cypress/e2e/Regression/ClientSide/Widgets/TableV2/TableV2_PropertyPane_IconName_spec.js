const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableV2NewDslWithPagination.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget property pane feature validation", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Verify table column type changes effect on menuButton and iconButton", function () {
    cy.openPropertyPane("tablewidgetv2");
    cy.addColumnV2("CustomColumn");
    _.table.ChangeColumnType("customColumn1", "Menu button", "v2");
    cy.wait(400);
    cy.moveToStyleTab();
    cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
    cy.getTableV2DataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("not.exist");
    });
    cy.moveToContentTab();
    cy.changeColumnType("Icon button");
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "add");
    cy.getTableV2DataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon-add").should("exist");
    });
    cy.changeColumnType("Menu button");
    cy.wait(500);
    cy.moveToStyleTab();
    cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
    cy.getTableV2DataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("not.exist");
    });

    cy.closePropertyPane();
  });
});
