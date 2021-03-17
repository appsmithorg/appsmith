const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetLocators = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/newFormDsl.json");
const pages = require("../../../../locators/Pages.json");
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
  it("Dropdown Widget Functionality", function() {
    cy.widgetText(
      "lock",
      formWidgetsPage.dropdownWidget,
      commonlocators.containerInnerText,
    );
    cy.get(formWidgetsPage.dropdownSelectionType)
      .last()
      .click({ force: true });
    cy.get(commonlocators.dropdownmenu)
      .children()
      .contains("Multi Select")
      .click();
    cy.get(formWidgetsPage.dropdownSelectionType)
      .last()
      .should("have.text", "Multi Select");
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextDropdown);
    cy.get(formWidgetsPage.dropdownInput).click({ force: true });
    cy.get(formWidgetsPage.dropdownInput).type("Option");
    cy.dropdownDynamic("Option 1");
    cy.PublishtheApp();
  });
  it("Dropdown Functionality To Validate Options", function() {
    cy.get(formWidgetsPage.dropdownInput).click({ force: true });
    cy.get(formWidgetsPage.dropdownInput).type("Option");
    cy.dropdownDynamic("Option 2");
    cy.get(publish.backToEditor).click();
  });
  it("Dropdown Functionality To Unchecked Visible Widget", function() {
    cy.openPropertyPane("dropdownwidget");
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
