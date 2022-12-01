const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tableV2AndTextDsl.json");

describe("Table Widget V2 Filtered Table Data in autocomplete", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("1. Table Widget V2 Functionality", function() {
    cy.openPropertyPane("tablewidgetv2");
    cy.wait("@updateLayout");
  });

  it("2. Table Widget V2 Functionality To Filter and search data", function() {
    cy.get(publish.searchInput)
      .first()
      .type("query");
    cy.get(publish.filterBtn).click({ force: true });
    cy.get(publish.attributeDropdown).click({ force: true });
    cy.get(publish.attributeValue)
      .contains("task")
      .click({ force: true });
    cy.get(publish.conditionDropdown).click({ force: true });
    cy.get(publish.attributeValue)
      .contains("contains")
      .click({ force: true });
    cy.get(publish.tableFilterInputValue).type("bind", { force: true });
    cy.wait(500);
    cy.get(widgetsPage.filterApplyBtn).click({ force: true });
    cy.wait(500);
    cy.get(".t--close-filter-btn").click({ force: true });
  });

  it("3. Table Widget V2 Functionality to validate filtered table data", function() {
    cy.SearchEntityandOpen("Text1");
    cy.testJsontext("text", "{{Table1.filteredTableData[0].task}}");
    cy.readTableV2data("0", "1").then((tabData) => {
      const tableData = tabData;
      cy.get(commonlocators.labelTextStyle).should("have.text", tableData);
    });
  });

  it("4. Table Widget V2 Functionality to validate filtered table data with actual table data", function() {
    cy.readTableV2data("0", "1").then((tabData) => {
      const tableData = JSON.parse(dsl.dsl.children[0].tableData);
      cy.get(commonlocators.labelTextStyle).should(
        "have.text",
        tableData[2].task,
      );
    });
  });
});
