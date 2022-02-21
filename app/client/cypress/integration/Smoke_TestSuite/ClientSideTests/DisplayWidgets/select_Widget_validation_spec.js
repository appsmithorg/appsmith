/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../locators/Widgets.json");
const commonlocators = require("../../../../locators/commonlocators.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/selectWidgetDsl.json");

describe("Select Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Select Widget name update", function() {
    cy.openPropertyPane("selectwidget");
    cy.widgetText(
      "Select1",
      widgetsPage.selectwidget,
      commonlocators.selectInner,
    );
  });

  it("Disable the widget and check in publish mode", function() {
    cy.get(widgetsPage.disable).scrollIntoView({ force: true });
    cy.get(widgetsPage.selectWidgetDisabled).click({ force: true });
    cy.get(".bp3-disabled").should("be.visible");
    cy.PublishtheApp();
    cy.get(".bp3-disabled").should("be.visible");
    cy.goToEditFromPublish();
  });

  it("enable the widget and check in publish mode", function() {
    cy.openPropertyPane("selectwidget");
    cy.get(".bp3-disabled").should("be.visible");
    cy.get(widgetsPage.disable).scrollIntoView({ force: true });
    cy.get(widgetsPage.selectWidgetDisabled).click({ force: true });
    cy.get(".bp3-button").should("be.visible");
    cy.PublishtheApp();
    cy.get(".bp3-button")
      .should("be.visible")
      .click({ force: true });
    cy.get(".bp3-active div").should("contain.text", "Green");
    cy.goToEditFromPublish();
  });
});
