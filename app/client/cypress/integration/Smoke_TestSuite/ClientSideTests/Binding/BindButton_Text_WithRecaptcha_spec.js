const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const dsl = require("../../../../fixtures/buttonRecaptchaDsl.json");
const pages = require("../../../../locators/Pages.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const testdata = require("../../../../fixtures/testdata.json");

describe("Binding the Button widget with Text widget using Recpatcha v3", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Validate the Button binding with Text Widget with Recaptcha Token", function() {
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("be.visible");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("have.value", "");
    cy.SearchEntityandOpen("Button1");
    cy.get(".t--property-control-googlerecaptchaversion .bp3-popover-target")
      .last()
      .should("be.visible")
      .click({ force: true });
    cy.get(".t--dropdown-option:contains('reCAPTCHA v2')").click({
      force: true,
    });
    cy.get("button")
      .contains("Submit")
      .should("be.visible")
      .click({ force: true });
    cy.SearchEntityandOpen("Text1");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("be.visible");
    cy.get(".t--draggable-textwidget .bp3-ui-text").should("have.value", "");
  });
});
