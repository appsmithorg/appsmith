const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Dropdown Widget Functionality", function() {
  beforeEach(() => {
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
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.data.dropdownInput);
    cy.get(formWidgetsPage.labelvalue).should("have.text", "TestD");
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
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
