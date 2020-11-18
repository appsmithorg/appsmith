const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tableDsl.json");
const pages = require("../../../locators/Pages.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check open/collapse and column update in property pane", function() {
    cy.openPropertyPane("tablewidget");
    //check open and collapse
    /*
    cy.get(".open-collapse")
      .first()
      .should("be.visible")
      .click();
    cy.tableDataHide("tabledata");
    cy.get(".open-collapse")
      .first()
      .should("be.visible")
      .click();
      */
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnPopertyUpdate("id", "TestUpdated");
  });

  it("Update table data and check the column names updated", function() {
    cy.widgetText("Table1", widgetsPage.tableWidget, commonlocators.tableInner);
    cy.testJsontext("tabledata", JSON.stringify(this.data.TableInput));
    cy.wait("@updateLayout");
    /*
    cy.get("[data-rbd-draggable-id='id']")
      .scrollIntoView();
    cy.get("[data-rbd-draggable-id='TestUpdated']")
      .first()
      .focus({ force: true })
      .should("not.be.visible");
    */
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.get(".draggable-header ")
      .contains("TestUpdated")
      .should("not.be.visible");
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
