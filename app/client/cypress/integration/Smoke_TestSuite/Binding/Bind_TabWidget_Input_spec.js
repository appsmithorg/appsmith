const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/tabInputDsl.json");
const pages = require("../../../locators/Pages.json");
const widgetsPage = require("../../../locators/Widgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const testdata = require("../../../fixtures/testdata.json");

describe("Binding the multiple input Widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Input widget test with default value from tab widget", function() {
    cy.SearchEntityandOpen("Input1");
    cy.get(widgetsPage.defaultInput).type(testdata.tabBinding);
    cy.get(commonlocators.editPropCrossButton).click();
    cy.wait("@updateLayout").should(
      "have.nested.property",
      "response.body.responseMeta.status",
      200,
    );
  });

  it("validation of data displayed in input widgets based on tab selected", function() {
    cy.PublishtheApp();
    cy.get(commonlocators.selectTab)
      .last()
      .click();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "Tab 2");
    cy.get(commonlocators.selectTab)
      .last()
      .click();
    cy.get(publish.inputWidget + " " + "input")
      .first()
      .invoke("attr", "value")
      .should("contain", "Tab 2");
  });
});
