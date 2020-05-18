const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const widgetsPage = require("../../../locators/Widgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Checkbox Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });

  it("Checkbox Widget Functionality", function() {
    cy.openPropertyPane("checkboxwidget");
    /**
     * @param{Text} Random Text
     * @param{CheckboxWidget}Mouseover
     * @param{CheckboxPre Css} Assertion
     */
    cy.widgetText(
      "checker",
      formWidgetsPage.checkboxWidget,
      widgetsPage.checkboxInput,
    );
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.data.checkbocInputName);
    cy.get(widgetsPage.checkboxLabel).should("have.text", "value");
    /**
     * @param{toggleButton Css} Assert to be checked
     */
    cy.togglebar(widgetsPage.defaultcheck);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextCheckbox);
    cy.get(widgetsPage.checkboxLabel)
      .contains("value")
      .click({ force: true });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
