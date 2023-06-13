const dsl = require("../../../../fixtures/dynamicHeightCanvasResizeDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import {
  entityExplorer,
  locators,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";

describe("Dynamic Height Width validation with multiple containers and text widget", function () {
  it("1. Validate change with auto height width for widgets", function () {
    const textMsg =
      "Dynamic panel validation for text widget wrt height Dynamic panel validation for text widget wrt height Dynamic panel validation for text widget wrt height";
    cy.addDsl(dsl);
    //Select the Outer container and capture initial height
    entityExplorer.SelectEntityByName("Container1");
    agHelper
      .GetWidgetHeight(locators._widgetInDeployed("containerwidget"))
      .then((initialContainerHeight) => {
        //Select the Text Widget and capture its initial height
        entityExplorer.SelectEntityByName("Text1", "Container1");
        agHelper
          .GetWidgetHeight(locators._widgetInDeployed("textwidget"))
          .then((initialTextWidgetHeight) => {
            //Change the text label based on the textMsg above
            cy.testCodeMirror(textMsg);
            cy.moveToStyleTab();
            cy.ChangeTextStyle(
              this.data.TextHeading,
              commonlocators.headingTextStyle,
              textMsg,
            );
            cy.wait("@updateLayout");
            //Select the Text Widget and capture its updated height post change of text label
            entityExplorer.SelectEntityByName("Text1");
            agHelper
              .GetWidgetHeight(locators._widgetInDeployed("textwidget"))
              .then((updatedTextWidgetHeight) => {
                //Asserts the change in height from initial height of text widget wrt updated height
                expect(initialTextWidgetHeight).to.not.equal(
                  updatedTextWidgetHeight,
                );
                //Select the outer Container Widget and capture its updated height post change of text label
                entityExplorer.SelectEntityByName("Container1");
                agHelper
                  .GetWidgetHeight(
                    locators._widgetInDeployed("containerwidget"),
                  )
                  .then((updatedContainerHeight) => {
                    //Asserts the change in height from initial height of container widget wrt updated height
                    expect(initialContainerHeight).to.not.equal(
                      updatedContainerHeight,
                    );
                    entityExplorer.SelectEntityByName("Text1");
                    cy.moveToContentTab();
                    const modifierKey =
                      Cypress.platform === "darwin" ? "meta" : "ctrl";
                    //Clear Text Label
                    cy.get(".CodeMirror textarea")
                      .first()
                      .focus()
                      .type(`{${modifierKey}}a`)
                      .then(($cm) => {
                        if ($cm.val() !== "") {
                          cy.get(".CodeMirror textarea").first().clear({
                            force: true,
                          });
                        }
                      });
                    cy.wait("@updateLayout");
                    entityExplorer.SelectEntityByName("Container1");
                    agHelper
                      .GetWidgetHeight(
                        locators._widgetInDeployed("containerwidget"),
                      )
                      .then((revertedContainerHeight) => {
                        //Asserts the change in height from updated height of container widget wrt current height
                        //As the text label is cleared the reverted height should be equal to initial height
                        expect(initialContainerHeight).to.equal(
                          revertedContainerHeight,
                        );
                      });
                  });
              });
          });
      });
  });
});
