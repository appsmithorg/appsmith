/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/selectCyclicDsl.json");
const selectdsl = require("../../../../../fixtures/selectRegDsl.json");

xdescribe("Select Widget Regression Functionality", function() {
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
  it("Validate Cyclic redundancy message", function() {
    cy.get(".select-button").click({ force: true });
    // open the select widget
    cy.get(".menu-item-text")
      .contains("Red")
      .click({ force: true });
    cy.wait(200);
    cy.get(".t--toast-action span").contains("Cyclic dependency");
    cy.PublishtheApp();
    cy.get(".t--toast-action span").contains("Cyclic dependency");
    cy.goToEditFromPublish();
  });
});

describe("Select Widget on change action check", function() {
  before(() => {
    cy.addDsl(selectdsl);
  });

  it("Select Widget name update", function() {
    cy.openPropertyPane("selectwidget");
    cy.widgetText(
      "Select1",
      widgetsPage.selectwidget,
      commonlocators.selectInner,
    );
  });
  it.skip("Validate On option change message", function() {
    cy.get(".select-button").click({ force: true });
    // open the select widget
    cy.get(".menu-item-text")
      .contains("Red")
      .click({ force: true });
    cy.wait(200);
    cy.get(".t--toast-action span").contains("Option changed");
    cy.PublishtheApp();
    cy.get(".select-button").click({ force: true });
    // open the select widget
    cy.get(".menu-item-text")
      .contains("Red")
      .click({ force: true });
    cy.wait(200);
    cy.get(".t--toast-action span").contains("Option changed");
    cy.goToEditFromPublish();
  });

  it("Validate enable JS functionality", function() {
    cy.openPropertyPane("selectwidget");
    cy.wait(5000);
    cy.get(".t--property-control-required .t--js-toggle").click({
      force: true,
    });
    cy.get(".t--property-control-filterable .t--js-toggle").click({
      force: true,
    });
    cy.changePosition("Auto");
    cy.changePosition("Top");
    cy.changePosition("Left");
  });
});
