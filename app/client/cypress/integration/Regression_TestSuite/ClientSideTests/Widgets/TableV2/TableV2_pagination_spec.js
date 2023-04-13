const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/tableV2NewDslWithPagination.json");
const { ObjectsRegistry } = require("../../../../../support/Objects/Registry");

const table = ObjectsRegistry.Table;

describe("Table Widget property pane feature validation", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Verify table column type changes effect on menuButton and iconButton", function () {
    cy.openPropertyPane("tablewidgetv2");
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.get(".t--property-control-totalrecords pre.CodeMirror-line span span")
      .click()
      .type("26");
    cy.wait(1000);
    cy.get(`.t--draggable-tablewidgetv2 span[data-pagecount="11"]`).should(
      "exist",
    );

    // Cleanup
    cy.UncheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.closePropertyPane();
  });

  it("2. updates previous and next pagination propeties properly in non server side pagination mode", function () {
    cy.openPropertyPane("tablewidgetv2");

    // The text field has two bindings in its text value, as below
    // "{{Table1.previousPageVisited}} {{Table1.nextPageVisited}}"

    // Click on next page
    cy.get(".t--table-widget-next-page").click();
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

    // Click on previous page
    cy.get(".t--table-widget-prev-page").click();
    cy.get(commonlocators.bodyTextStyle).should("have.text", "true false");

    // Type and go to next page
    cy.get(".t--table-widget-page-input .bp3-input").clear().type("2{enter}");
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

    // Type and go to previous page
    cy.get(".t--table-widget-page-input .bp3-input").clear().type("1{enter}");
    cy.get(commonlocators.bodyTextStyle).should("have.text", "true false");

    // pagination flags should get reset whenever a user searches for any text

    table.SearchTable("Michael Lawson");
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false false");
    table.resetSearch();

    // Pagination properties should get reset when user filters for any criteria.
    cy.get(".t--table-widget-next-page").click();
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");
    table.OpenNFilterTable("userName", "contains", "Michael Lawson");
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false false");
    table.RemoveFilter();

    cy.get(".t--table-widget-next-page").click();
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

    // pagination properties should work in server side mode
    cy.CheckWidgetProperties(commonlocators.serverSidePaginationCheckbox);
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false false");

    // Click on next page
    cy.get(".t--table-widget-next-page").click();
    cy.get(commonlocators.bodyTextStyle).should("have.text", "false true");

    // Click on previous page
    cy.get(".t--table-widget-prev-page").click();
    cy.get(commonlocators.bodyTextStyle).should("have.text", "true false");
  });
});
