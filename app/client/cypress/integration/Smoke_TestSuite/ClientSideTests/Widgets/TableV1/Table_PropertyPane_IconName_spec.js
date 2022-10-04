const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableNewDslWithPagination.json");
var appId = " ";

describe("Table Widget property pane feature validation", function() {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });

  it("Verify table column type changes effect on menuButton and iconButton", function() {
    cy.openPropertyPane("tablewidget");
    cy.addColumn("CustomColumn");
    cy.editColumn("customColumn1");

    cy.changeColumnType("Menu Button");
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
    cy.getTableDataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("not.exist");
    });

    cy.changeColumnType("Icon Button");
    cy.wait(400);
    cy.get(commonlocators.selectedIcon).should("have.text", "add");
    cy.getTableDataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("exist");
      cy.get(selector + " button span.bp3-icon")
        .should("have.attr", "icon")
        .and("equal", "add");
    });

    cy.changeColumnType("Menu Button");
    cy.wait(500);
    cy.get(commonlocators.selectedIcon).should("have.text", "(none)");
    cy.getTableDataSelector("1", "5").then((selector) => {
      cy.get(selector + " button span.bp3-icon").should("not.exist");
    });

    cy.closePropertyPane();
  });
});
