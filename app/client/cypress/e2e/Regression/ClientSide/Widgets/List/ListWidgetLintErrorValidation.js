const commonlocators = require("../../../../../locators/commonlocators.json");
import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Linting warning validation with list widget",
  { tags: ["@tag.Widget", "@tag.List"] },
  function () {
    before(() => {
      _.agHelper.AddDsl("listWidgetLintDsl");
    });
    it("Linting Error validation on mouseover and errorlog tab", function () {
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
      cy.get(commonlocators.lintError).first().should("be.visible");
      cy.get(commonlocators.lintError).last().should("be.visible");

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
        .contains("'DATA' is not defined.");

      _.debuggerHelper.OpenDebugger();

      cy.get(commonlocators.debugErrorMsg).should("have.length", 6);
    });
  },
);
