const commonlocators = require("../../../locators/commonlocators.json");
const dsl = require("../../../fixtures/commondsl.json");
const widgetsPage = require("../../../locators/Widgets.json");

describe("Input Widget Functionality", function() {
  beforeEach(() => {
    cy.addDsl(dsl);
  });
  it("Input Widget Functionality", function() {
    cy.openPropertyPane("inputwidget");
    /**
     * @param{Text} Random Text
     * @param{InputWidget}Mouseover
     * @param{InputPre Css} Assertion
     */
    cy.widgetText("day", widgetsPage.inputWidget, widgetsPage.inputval);
    /**
     * @param{Text} Random Value
     */
    cy.testCodeMirror(this.data.inputdata);
    cy.get(widgetsPage.label)
      .first()
      .trigger(this.data.Hover, { force: true })
      .should("have.text", "one");
    cy.get(widgetsPage.datatype)
      .find(commonlocators.dropdownbuttonclick)
      .click({ force: true })
      .get(commonlocators.dropdownmenu)
      .children()
      .contains("Number")
      .click();
    cy.get(widgetsPage.innertext)
      .click({ force: true })
      .type(this.data.para)
      .should("be.empty");
    cy.openPropertyPane("inputwidget");
    cy.get(widgetsPage.defaultInput)
      .type(this.data.command)
      .type("hello");
    cy.get(widgetsPage.placeholder)
      .type(this.data.command)
      .type(this.data.placeholder);
    /**
     * @param{Widget} Widget InnerCss
     */
    cy.get(widgetsPage.innertext)
      .invoke("attr", "placeholder")
      .should("contain", "check");
    cy.get(widgetsPage.Regex)
      .click()
      .type(this.data.regex);
    /**
     * @param{Show Alert} Css for InputChange
     */
    cy.getAlert(commonlocators.optionchangetextInput);
    cy.get(widgetsPage.inputButtonPos)
      .eq(0)
      .click({ force: true });
  });

  afterEach(() => {
    // put your clean up code if any
  });
});
