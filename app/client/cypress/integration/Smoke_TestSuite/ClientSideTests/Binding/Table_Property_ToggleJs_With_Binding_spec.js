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
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingAlign);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.readTabledataValidateCSS("0", "0", "justify-content", "flex-start");
    cy.readTabledataValidateCSS("1", "0", "justify-content", "flex-end");
  });

  it("Table widget change text size and validate", function() {
    cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextAlign)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.textSize)
      .last()
      .click({ force: true });
    cy.wait(1000);
    cy.selectTextSize("Heading 1");
    cy.get(commonlocators.editPropCrossButton).click();
    cy.readTabledataValidateCSS("0", "0", "font-size", "24px");
  });

  it("Table widget toggle test for text size", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextSize)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingSize);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.readTabledataValidateCSS("0", "0", "font-size", "14px");
    cy.readTabledataValidateCSS("1", "0", "font-size", "24px");
  });

  it("Table widget toggle test for vertical Alignment", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleTextSize)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.toggleVerticalAlig)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingVerticalAlig);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.readTabledataValidateCSS("0", "0", "align-items", "flex-start");
    cy.readTabledataValidateCSS("1", "0", "align-items", "flex-end");
  });

  it("Table widget toggle test for style Alignment", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleVerticalAlig)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.toggleTextStyle)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingStyle);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.readTabledataValidateCSS("0", "0", "font-style", "normal");
    cy.readTabledataValidateCSS("1", "0", "font-style", "italic");
  });

  it("Table widget toggle test for text color", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleVerticalAlig)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.toggleJsColor)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingTextColor);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout");
    cy.readTabledataValidateCSS("0", "0", "color", "rgb(0, 128, 0)");
    cy.readTabledataValidateCSS("1", "0", "color", "rgb(255, 0, 0)");
  });

  it("Table widget toggle test for background color", function() {
    cy.openPropertyPane("tablewidget");
    cy.editColumn("id");
    cy.get(widgetsPage.toggleJsColor)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.get(widgetsPage.toggleJsBcgColor)
      .first()
      .click({ force: true });
    cy.wait(1000);
    cy.toggleJsAndUpdate("tabledata", testdata.bindingTextColor);
    cy.get(commonlocators.editPropCrossButton).click();
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
