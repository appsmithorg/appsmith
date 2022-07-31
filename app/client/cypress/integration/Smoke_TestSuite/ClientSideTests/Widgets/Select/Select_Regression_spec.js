/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/selectCyclicDsl.json");
const selectdsl = require("../../../../../fixtures/selectRegDsl.json");

xdescribe("Select Widget Regression Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Select Widget name update", function () {
    cy.openPropertyPane("selectwidget");
    cy.widgetText(
      "Select1",
      widgetsPage.selectwidget,
      commonlocators.selectInner,
    );
  });
  it("Validate Cyclic redundancy message", function () {
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

xdescribe("Select Widget on change action check", function () {
  before(() => {
    cy.addDsl(selectdsl);
  });

  it("Select Widget name update", function () {
    cy.openPropertyPane("selectwidget");
    cy.widgetText(
      "Select1",
      widgetsPage.selectwidget,
      commonlocators.selectInner,
    );
  });
  it.skip("Validate On option change message", function () {
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

  it("Validate enable JS functionality", function () {
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

describe("Select Widget on change action check", function () {
  before(() => {
    cy.addDsl(selectdsl);
  });

  it("Select Widget name update", function () {
    cy.openPropertyPane("selectwidget");
    cy.widgetText(
      "Select1",
      widgetsPage.selectwidget,
      commonlocators.selectInner,
    );
  });

  it.skip("Enable server side filtering and validate", function () {
    cy.get(".t--property-control-onfilterupdate").should("not.exist");
    cy.get(".t--property-control-serversidefiltering .bp3-control-indicator").click({ force: true });
    cy.get(".t--property-control-onfilterupdate").should("be.visible");
    cy.addOnFilterUpdate("onfilterupdate", "Success");
  });

  it.skip("Enable server side filtering and validate in publish mode", function () {
    cy.openPropertyPane("selectwidget");
    cy.PublishtheApp();
    cy.get(".select-button").click({ force: true });
    cy.wait(200);
    cy.get(".bp3-input").type("Red");
    cy.get(".t--toast-action span").contains("Success");
    cy.get(".bp3-button > .bp3-icon > svg").click({ force: true });
    cy.goToEditFromPublish();
  });

  it("Update and validate various view types", function () {
    cy.get("[data-testid=div-selection-0]").click({ force: true });
    cy.changeView(3, "1596", "1600");
    cy.PublishtheApp();
    cy.get(".t--app-viewer-page").invoke('attr', 'width')
      .should('eq', "800");
    cy.goToEditFromPublish();
    cy.changeView(2,"1584","1696");
    cy.PublishtheApp();
    cy.get(".t--app-viewer-page").invoke('attr', 'width')
      .should('eq', "1080");
    cy.goToEditFromPublish();
    cy.changeView(4,"1584","900");
    cy.PublishtheApp();
    cy.get(".t--app-viewer-page").invoke('attr', 'width')
      .should('eq', "450");
    cy.goToEditFromPublish();
    cy.changeView(1,"1584","1696");
    cy.PublishtheApp();
    cy.get(".t--app-viewer-page").invoke('attr', 'width')
      .should('eq', "1274");
    cy.goToEditFromPublish();
    cy.changeView(3,"1584","1552");
    cy.PublishtheApp();
    cy.get(".t--app-viewer-page").invoke('attr', 'width')
      .should('eq', "800");
    cy.goToEditFromPublish();
  });

});
