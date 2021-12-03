const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/snippetErrordsl.json");
const formWidgetDsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");

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
    //click on the text within the section
    cy.get(commonlocators.labelSection)
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
      .contains("Missing semicolon.");
    cy.get(commonlocators.lintErrorMsg)
      .should("be.visible")
      .contains("Expected an identifier and instead saw ')");
    cy.get(commonlocators.lintErrorMsg)
      .should("be.visible")
      .contains(
        "Expected an assignment or function call and instead saw an expression",
      );
    cy.get(commonlocators.lintErrorMsg)
      .should("be.visible")
      .contains(
        "'function closure expressions' is only available in Mozilla JavaScript extensions (use moz option)",
      );
  });
});
