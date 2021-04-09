/* eslint-disable cypress/no-unnecessary-waiting */

const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/tableNewDsl.json");
const pages = require("../../../../locators/Pages.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Table Widget property pane feature validation", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Test to validate table pagination is disabled", function() {
    cy.get(".t--table-widget-prev-page").should("have.attr", "disabled");
    cy.get(".t--table-widget-next-page").should("have.attr", "disabled");
    cy.get(".t--table-widget-page-input input").should("have.attr", "disabled");
  });

  it("Test to validate text allignment", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "center");
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-start");
  });

  it("Test to validate column heading allignment", function() {
    // cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.centerAlign)
      .first()
      .click({ force: true });
    cy.get(".draggable-header")
      .first()
      .should("have.css", "text-align", "center");
    cy.get(widgetsPage.rightAlign)
      .first()
      .click({ force: true });
    cy.get(".draggable-header")
      .first()
      .should("have.css", "text-align", "right");
    cy.get(widgetsPage.leftAlign)
      .first()
      .click({ force: true });
    cy.get(".draggable-header")
      .first()
      .should("have.css", "text-align", "left");
  });

  it("Test to validate text format", function() {
    cy.get(widgetsPage.bold).click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "font-weight", "700");
    cy.get(widgetsPage.italics).click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "font-style", "italic");
  });

  it("Test to validate vertical allignment", function() {
    cy.get(widgetsPage.verticalTop).click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-start");
    cy.get(widgetsPage.verticalCenter)
      .last()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "center");
    cy.get(widgetsPage.verticalBottom)
      .last()
      .click({ force: true });
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-end");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
  });

  it("Table widget toggle test for text alignment", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextAlign)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingGenAlign);
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    cy.readTabledataValidateCSS("0", "0", "justify-content", "flex-end");
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-start");
  });

  it("Table widget change text size and validate", function() {
    cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextAlign)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(widgetsPage.textSize)
      .last()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.selectTextSize("Heading 1");
    cy.readTabledataValidateCSS("0", "0", "font-size", "24px");
    cy.get(commonlocators.editPropCrossButton).click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.readTabledataValidateCSS("0", "0", "font-size", "24px");
  });

  it("Test to validate open new tab icon shows when URL type data is hovered", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("email");
    cy.changeColumnType("URL");
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=1] .hidden-icon`,
    ).invoke("show");
    cy.get(
      `.t--widget-tablewidget .tbody .td[data-rowindex=1][data-colindex=1] .hidden-icon`,
    ).should("be.visible");
    cy.get(commonlocators.editPropCrossButton).click();
  });

  it("Test to validate text color and text background", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(widgetsPage.textColor)
      .first()
      .click({ force: true });
    cy.xpath(widgetsPage.greenColor).click();
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(3, 179, 101)");
    cy.get(widgetsPage.textColor)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(128, 0, 128)");
    cy.get(widgetsPage.backgroundColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.xpath(widgetsPage.greenColor)
      .first()
      .click();
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS(
      "1",
      "0",
      "background",
      "rgb(3, 179, 101) none repeat scroll 0% 0% / auto padding-box border-box",
    );
    cy.get(widgetsPage.backgroundColor)
      .clear({ force: true })
      .type("purple", { force: true });
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS(
      "1",
      "0",
      "background",
      "rgb(128, 0, 128) none repeat scroll 0% 0% / auto padding-box border-box",
    );
  });
});
