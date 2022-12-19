const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/snippetDsl.json");

describe("Linting warning validation with Checkbox widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Linting warning validation", function() {
    cy.openPropertyPane("checkboxwidget");
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
      .last()
      .trigger("mouseover", { force: true })
      .wait(500);
    //lint warning message
    cy.get(commonlocators.lintErrorMsg)
      .should("be.visible")
      .contains("'iron_man' is not defined.");
  });
});
