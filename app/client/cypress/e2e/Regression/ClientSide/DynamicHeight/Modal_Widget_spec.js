const commonlocators = require("../../../../locators/commonlocators.json");
import {
  entityExplorer,
  agHelper,
  locators,
} from "../../../../support/Objects/ObjectsCore";

const textMsg =
  "Dynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt height Dynamic panel validation for text widget Dynamic panel validation for text widget Dynamic panel validation for text widget";

describe("Dynamic Height Width validation with limits", function () {
  it("1. Validate change in auto height with limits width for widgets and highlight section validation", function () {
    cy.addDsl(dsl);
    entityExplorer.SelectEntityByName("Modal1", "Widgets");
    agHelper.GetWidgetHeight(locators._modal).then((currentModalHeight) => {
      entityExplorer.SelectEntityByName("Text1", "Modal1");
      agHelper.AssertElementVisible(commonlocators.generalSectionHeight);
      cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
      entityExplorer.SelectEntityByName("Text1", "Modal1");
      agHelper
        .GetWidgetHeight(locators._widgetInDeployed("textwidget"))
        .then((currentTextHeight) => {
          cy.testCodeMirror(textMsg);
          cy.wait("@updateLayout");
          agHelper
            .GetWidgetHeight(locators._widgetInDeployed("textwidget"))
            .then((changedTextHeight) => {
              expect(currentTextHeight).to.not.equal(changedTextHeight);
            });
          entityExplorer.SelectEntityByName("Modal1", "Widgets");
          cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
          agHelper
            .GetWidgetHeight(locators._modal)
            .then((changedModalHeight) => {
              expect(currentModalHeight).to.not.equal(changedModalHeight);
            });
        });
    });
  });
});
