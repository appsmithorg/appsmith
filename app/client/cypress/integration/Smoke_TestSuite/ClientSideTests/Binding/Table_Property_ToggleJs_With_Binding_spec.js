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

  it("Table widget toggle test for text alignment", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextAlign)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingAlign);

    cy.readTabledataValidateCSS("0", "0", "justify-content", "flex-start");
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");
  });

  it("Table widget change text size and validate", function() {
    cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
    cy.openPropertyPane("tablewidget");
    cy.get(".t--property-pane-back-btn").click({ force: true });
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
    cy.selectTxtSize("XL");

    cy.readTabledataValidateCSS("0", "0", "font-size", "30px");
  });

  it("Table widget toggle test for text size", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextSize)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingSize);

    cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
    cy.readTabledataValidateCSS("1", "0", "font-size", "24px");
  });

  it("Table widget toggle test for vertical Alignment", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextSize)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(widgetsPage.toggleVerticalAlig)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingVerticalAlig);

    cy.readTabledataValidateCSS("0", "0", "align-items", "flex-start");
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-end");
  });

  it("Table widget toggle test for style Alignment", function() {
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleVerticalAlig)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(widgetsPage.toggleTextStyle)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdateWithIndex("tabledata", testdata.bindingStyle, 3);
    cy.readTabledataValidateCSS("0", "0", "font-style", "normal");
    cy.readTabledataValidateCSS("1", "0", "font-style", "italic");
  });

  it("Table widget toggle test for text color", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.editColumn("id");
    cy.get(widgetsPage.toggleVerticalAlig)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(widgetsPage.toggleJsColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.toggleJsAndUpdateWithIndex("tabledata", testdata.bindingTextColor, 5);

    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("0", "0", "color", "rgb(0, 128, 0)");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(255, 0, 0)");
  });

  it("Table widget toggle test for background color", function() {
    cy.openPropertyPane("tablewidget");
    cy.get(".t--property-pane-back-btn").click({ force: true });
    cy.editColumn("id");
    cy.get(widgetsPage.toggleJsColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(1000);
    cy.get(widgetsPage.toggleJsBcgColor)
      .first()
      .click({ force: true });
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(2000);
    cy.toggleJsAndUpdateWithIndex("tabledata", testdata.bindingTextColor, 6);

    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS(
      "0",
      "0",
      "background",
      "rgb(0, 128, 0) none repeat scroll 0% 0% / auto padding-box border-box",
    );
    cy.readTabledataValidateCSS(
      "1",
      "0",
      "background",
      "rgb(255, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box",
    );
  });
});
