/* eslint-disable cypress/no-unnecessary-waiting */
const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe("Select Widget Functionality", function () {
  before(() => {
    cy.fixture("formSelectDsl").then((val) => {
      _.agHelper.AddDsl(val);
    });
  });

  it("Select Widget name update", function () {
    cy.openPropertyPane("selectwidget");
    cy.widgetText(
      "Select1",
      widgetsPage.selectwidget,
      widgetsPage.widgetNameSpan,
    );
  });

  it("Disable the widget and check in publish mode", function () {
    cy.get(widgetsPage.disable).scrollIntoView({ force: true });
    cy.get(widgetsPage.selectWidgetDisabled).click({ force: true });
    cy.get(".bp3-disabled").should("be.visible");
    _.deployMode.DeployApp();
    cy.get(".bp3-disabled").should("be.visible");
    _.deployMode.NavigateBacktoEditor();
  });

  it("enable the widget and check in publish mode", function () {
    cy.openPropertyPane("selectwidget");
    cy.get(".bp3-disabled").should("be.visible");
    cy.get(widgetsPage.disable).scrollIntoView({ force: true });
    cy.get(widgetsPage.selectWidgetDisabled).click({ force: true });
    cy.get(".t--widget-selectwidget .bp3-button").should("be.visible");
    _.deployMode.DeployApp();
    cy.get(".t--widget-selectwidget .bp3-button")
      .should("be.visible")
      .click({ force: true });
    cy.get(commonlocators.singleSelectActiveMenuItem).should(
      "contain.text",
      "Green",
    );
  });
});
