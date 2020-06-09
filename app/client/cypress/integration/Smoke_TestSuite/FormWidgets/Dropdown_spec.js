const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const publish = require("../../../locators/publishWidgetspage.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Dropdown Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Dropdown Widget Functionality", function() {
    cy.openPropertyPane("dropdownwidget");
    /**
     * @param{Text} Random Text
     * @param{DropdownWidget}Mouseover
     * @param{DropdownPre Css} Assertion
     */
    cy.widgetText(
      "lock",
      formWidgetsPage.dropdownWidget,
      commonlocators.containerInnerText,
    );
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find(commonlocators.dropdownbuttonclick)
      .click({ force: true })
      .get(commonlocators.dropdownmenu)
      .children()
      .contains("Multi Select")
      .click();
    cy.get(formWidgetsPage.dropdownSelectionType)
      .find(commonlocators.menuSelection)
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
    cy.get(publish.dropdownWidget + " " + "input").should("not.be.visible");
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
