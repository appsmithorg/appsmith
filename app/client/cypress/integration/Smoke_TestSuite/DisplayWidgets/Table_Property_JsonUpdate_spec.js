const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tableNewDsl.json");
const pages = require("../../../locators/Pages.json");
const testdata = require("../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Add column in the property pane and validate in table widget", function() {
    cy.openPropertyPane("tablewidget");
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnPopertyUpdate("id", "TestUpdated");
    cy.addColumn("CustomColumn");
    cy.tableColumnDataValidation("DERIVED1"); //To be updated later
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.hideColumn("productName");
    cy.hideColumn("orderAmount");
    cy.get(".draggable-header:contains('CustomColumn')").should("be.visible");
  });

  it("Update table json data and check the column names updated", function() {
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnDataValidation("DERIVED1"); //To be updated later
    cy.get(widgetsPage.tableCol)
      .contains("TestUpdated")
      .should("not.be.visible");
  });
});
