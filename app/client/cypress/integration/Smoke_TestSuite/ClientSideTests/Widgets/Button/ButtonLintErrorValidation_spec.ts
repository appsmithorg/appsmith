const commonlocators = require("../../../../../locators/commonlocators.json");
const dsl = require("../../../../../fixtures/buttonLintErrorDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry"
let agHelper = ObjectsRegistry.AggregateHelper,
propPane = ObjectsRegistry.PropertyPane

describe("Linting warning validation with button widget", function() {
  before(() => {
    agHelper.AddDsl(dsl);
  });
  it("Linting Error validation on mouseover and errorlog tab", function() {
    propPane.OpenPropertyPane("buttonwidget");
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
      .should("be.visible")
      .contains("'lintError' is not defined.");

    cy.get(commonlocators.debugger)
      .should("be.visible")
      .click({ force: true });

    cy.get(commonlocators.errorTab)
      .should("be.visible")
      .click({ force: true });

    cy.get(commonlocators.debugErrorMsg).should("have.length", 3);
  });
});
