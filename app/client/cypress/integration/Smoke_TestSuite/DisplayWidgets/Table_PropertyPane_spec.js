const widgetsPage = require("../../../locators/Widgets.json");
const commonlocators = require("../../../locators/commonlocators.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/tableDsl.json");
const pages = require("../../../locators/Pages.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Check collapse section feature in property pane", function() {
    cy.openPropertyPane("tablewidget");
    //check open and collapse
    cy.get(".t--property-pane-section-collapse-general")
      .first()
      .should("be.visible")
      .click();
    cy.tableDataHide("tabledata");
  });

  it("Check open section and column data in property pane", function() {
    cy.get(".t--property-pane-section-collapse-general")
      .first()
      .should("be.visible")
      .click();
    cy.tableColumnDataValidation("id");
    cy.tableColumnDataValidation("email");
    cy.tableColumnDataValidation("userName");
    cy.tableColumnDataValidation("productName");
    cy.tableColumnDataValidation("orderAmount");
    cy.tableColumnPopertyUpdate("id", "TestUpdated");
    cy.addColumn("CustomColumn");
  });

  it("Update table json data and check the column names updated", function() {
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
    cy.tableColumnDataValidation("DERIVED1"); //To be updated later
    cy.get(".draggable-header ")
      .contains("TestUpdated")
      .should("not.be.visible");
  });

  it("Edit column data in property pane validate text allignment", function() {
    cy.editColumn("id");
    cy.get(".t--icon-tab-CENTER")
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "center");
    cy.get(".t--icon-tab-RIGHT")
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");
    cy.get(".t--icon-tab-LEFT")
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-start");
  });

  it("Edit column data in property pane validate font", function() {
    cy.get(".t--button-tab-BOLD").click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "font-weight", "500");
    cy.get(".t--button-tab-ITALIC").click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "font-style", "italic");
  });

  it("Edit column data in property pane validate vertical allignment", function() {
    cy.get(".t--icon-tab-TOP").click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-start");
    cy.get(".t--icon-tab-CENTER")
      .last()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "center");
    cy.get(".t--icon-tab-BOTTOM")
      .last()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-end");
  });

  it("Edit column data in property pane validate text color and text background", function() {
    cy.get(".t--property-control-textcolor input")
      .first()
      .click({ force: true });
    cy.xpath("//div[@color='#29CCA3']").click();
    cy.wait(5000);
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(41, 204, 163)");
    cy.get(".t--property-control-textcolor .t--js-toggle").click();
    cy.testCodeMirror("purple");
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(35, 31, 32)");
    cy.get(".t--property-control-cellbackground input")
      .first()
      .click({ force: true });
    cy.xpath("//div[@color='#29CCA3']").click();
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "background", "rgb(41, 204, 163)");
    cy.get(".t--property-control-cellbackground .t--js-toggle").click();
    cy.testCodeMirror("purple");
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "background", "rgb(35, 31, 32)");
    /*
    cy.get(".draggable-header ")
      .contains("CustomColumn")
      .should("not.be.visible");
    cy.hideColumn("id");
    cy.hideColumn("email");
    cy.hideColumn("userName");
    cy.get(".draggable-header ")
      .contains("CustomColumn")
      .should("be.visible");
      */
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
