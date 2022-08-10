const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/listWidgetLintDsl.json");

describe("Linting warning validation with list widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Linting Error validation on mouseover and errorlog tab", function() {
    cy.openPropertyPane("listwidget");
    /**
     * @param{Text} Random Text
     * @param{CheckboxWidget}Mouseover
     * @param{CheckboxPre Css} Assertion
     */
    //Mouse hover to exact warning message
    cy.get(commonlocators.labelSectionTxt)
      .first()
      .click({ force: true })
      .wait(500);

    //lint mark validation
    cy.get(commonlocators.lintError)
      .first()
      .should("be.visible");
    cy.get(commonlocators.lintError)
      .last()
      .should("be.visible");

    cy.get(commonlocators.lintError)
      .first()
      .trigger("mouseover", { force: true })
      .wait(500);
    //lint warning message
    cy.get(commonlocators.lintErrorMsg)
      .should("be.visible")
      .contains("'NO' is not defined.");

    cy.get(commonlocators.lintError)
      .last()
      .trigger("mouseover", { force: true })
      .wait(500);
    //lint warning message
    cy.get(commonlocators.lintErrorMsg)
      .should("be.visible")
      .contains("'ERROR' is not defined.");

    cy.get(commonlocators.debugger)
      .should("be.visible")
      .click({ force: true });

    cy.get(commonlocators.errorTab)
      .should("be.visible")
      .click({ force: true });

    cy.get(commonlocators.debugErrorMsg)
      .eq(0)
      .contains("ReferenceError: ERROR is not defined");

    cy.get(commonlocators.debugErrorMsg)
      .eq(1)
      .contains("SyntaxError: Unexpected identifier");
  });
});
