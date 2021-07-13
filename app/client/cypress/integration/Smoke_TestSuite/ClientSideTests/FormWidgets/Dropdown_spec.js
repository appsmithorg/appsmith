const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const data = require("../../../../fixtures/example.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Selects value with invalid default value", () => {
    cy.openPropertyPane("dropdownwidget");

    cy.testJsontext("options", JSON.stringify(data.input));
    cy.testJsontext("defaultoption", "{{ undefined }}");
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.dropdownSingleSelect)
      .click({ force: true });
    cy.get(commonlocators.singleSelectMenuItem)
      .contains("Option 3")
      .click({ force: true });

    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.defaultSingleSelectValue)
      .should("have.text", "Option 3");
  });
  it("Selects value with enter in default value", () => {
    cy.testJsontext("defaultoption", "3\n");
    cy.get(formWidgetsPage.dropdownWidget)
      .find(widgetLocators.defaultSingleSelectValue)
      .should("have.text", "Option 3");
  });
  it("Dropdown Functionality To Unchecked Visible Widget", function() {
    cy.togglebarDisable(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.dropdownWidget + " " + "input").should("not.exist");
    cy.get(publish.backToEditor).click();
  });
  it("Dropdown Functionality To Check Visible Widget", function() {
    cy.openPropertyPane("dropdownwidget");
    cy.togglebar(commonlocators.visibleCheckbox);
    cy.PublishtheApp();
    cy.get(publish.dropdownWidget + " " + "input").should("be.visible");
    cy.get(publish.backToEditor).click();
  });
});
afterEach(() => {
  // put your clean up code if any
});
