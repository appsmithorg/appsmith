const commonlocators = require("../../../../locators/commonlocators.json");
const formWidgetsPage = require("../../../../locators/FormWidgets.json");
const widgetsPage = require("../../../../locators/Widgets.json");
const publish = require("../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../fixtures/textLintErrorDsl.json");
const formWidgetDsl = require("../../../../fixtures/formWidgetdsl.json");
const pages = require("../../../../locators/Pages.json");

describe("Linting warning validation with text widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Linting Error validation on mouseover and errorlog tab", function() {
    cy.openPropertyPane("textwidget");
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
      .contains("'Nodata' is not defined.");

    cy.get(commonlocators.lintError)
      .last()
      .trigger("mouseover", { force: true })
      .wait(500);
    //lint warning message
    cy.get(commonlocators.lintErrorMsg)
      .last()
      .should("be.visible")
      .contains("'lintErrror' is not defined.");

    cy.get(commonlocators.debugger)
      .should("be.visible")
      .click({ force: true });

    cy.get(commonlocators.errorTab)
      .should("be.visible")
      .click({ force: true });

    cy.get(commonlocators.debugErrorMsg)
      .eq(0)
      .contains("ReferenceError: error is not defined");

    cy.get(commonlocators.debugErrorMsg)
      .eq(1)
      .contains("ReferenceError: lintErrror is not defined");
  });
});
