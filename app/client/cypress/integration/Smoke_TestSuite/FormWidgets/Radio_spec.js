const commonlocators = require("../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../locators/FormWidgets.json");
const dsl = require("../../../fixtures/formdsl.json");

describe("Radio Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Radio Widget Functionality", function() {
    cy.openPropertyPane("radiogroupwidget");
    /**
     * @param{Text} Random Text
     * @param{RadioWidget}Mouseover
     * @param{RadioPre Css} Assertion
     */
    cy.widgetText(
      "radiotest",
      formWidgetsPage.radioWidget,
      formWidgetsPage.radioInput,
    );
    /**
     * @param{Text} Random Colour
     */
    cy.testCodeMirror(this.data.radioInputName);
    cy.get(formWidgetsPage.labelradio)
      .eq(0)
      .should("have.text", "Test Radio");
    /**
     * @param{IndexValue} Provide Input Index Value
     * @param{Text} Index Text Value.
     *
     */
    cy.radioInput(0, this.data.radio1);
    cy.get(formWidgetsPage.labelradio)
      .eq(1)
      .should("have.text", "test1");
    cy.radioInput(1, "1");
    cy.radioInput(2, this.data.radio2);
    cy.get(formWidgetsPage.labelradio)
      .eq(2)
      .should("have.text", "test2");
    cy.radioInput(3, "2");
    cy.radioInput(4, this.data.radio3);
    cy.get(formWidgetsPage.labelradio)
      .eq(3)
      .should("have.text", "test3");
    cy.radioInput(5, "3");
    cy.get(formWidgetsPage.radioAddButton).click({ force: true });
    cy.radioInput(6, this.data.radio4);
    cy.get(formWidgetsPage.labelradio)
      .eq(4)
      .should("have.text", "test4");
    cy.get(formWidgetsPage.deleteradiovalue)
      .eq(3)
      .click({ force: true });
    cy.get(formWidgetsPage.labelradio).should("not.have.value", "test4");
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangeRadioselect);
    cy.get(formWidgetsPage.defaultSelect);
    cy.get(formWidgetsPage.radioOnSelectionChangeDropdown)
      .get(commonlocators.dropdownSelectButton)
      .click({ force: true })
      .type(this.data.command)
      .type("2");
    cy.get(formWidgetsPage.labelradio)
      .eq(3)
      .click({ force: true });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
