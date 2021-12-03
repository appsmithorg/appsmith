const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Checkbox Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  it("Checkbox Functionality To Check required toggle for form", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.togglebar(commonlocators.requiredjs + " " + "input");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget).click();
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("have.class", "bp3-disabled");

    cy.get(publish.checkboxWidget).click();
    cy.get(widgetsPage.formButtonWidget)
      .contains("Submit")
      .should("not.have.attr", "disabled");

    cy.get(publish.backToEditor).click();
  });
  it("Checkbox Functionality To swap label placement of  checkbox", function() {
    cy.openPropertyPane("checkboxwidget");
    cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should(
      "not.exist",
    );
    cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should("exist");
    cy.get(commonlocators.optionalignment)
      .last()
      .click();
    cy.dropdownDynamicUpdated("Right");
    cy.PublishtheApp();
    cy.get(publish.checkboxWidget + " " + ".bp3-align-right").should("exist");
    cy.get(publish.checkboxWidget + " " + ".bp3-align-left").should(
      "not.exist",
    );
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
