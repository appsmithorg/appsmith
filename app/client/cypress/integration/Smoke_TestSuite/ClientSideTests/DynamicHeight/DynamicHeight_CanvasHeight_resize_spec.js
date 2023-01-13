const dsl = require("../../../../fixtures/dynamicHeightCanvasResizeDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const agHelper = ObjectsRegistry.AggregateHelper;

describe("Dynamic Height Width validation with multiple containers and text widget", function() {
  afterEach(() => {
    agHelper.SaveLocalStorageCache();
  });

  beforeEach(() => {
    agHelper.RestoreLocalStorageCache();
  });
  it("Validate change with auto height width for widgets", function() {
    const textMsg =
      "Dynamic panel validation for text widget wrt height Dynamic panel validation for text widget wrt height Dynamic panel validation for text widget wrt height";
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.get(".t--widget-containerwidget")
      .eq(0)
      .invoke("css", "height")
      .then((oheight) => {
        cy.get(".t--widget-textwidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            cy.openPropertyPane("textwidget");
            cy.get(".t--widget-textwidget")
              .invoke("css", "height")
              .then((theight) => {
                //Changing the text label
                cy.testCodeMirror(textMsg);
                cy.moveToStyleTab();
                cy.ChangeTextStyle(
                  this.data.TextHeading,
                  commonlocators.headingTextStyle,
                  textMsg,
                );
                cy.wait("@updateLayout");
                cy.get(".t--widget-textwidget")
                  .invoke("css", "height")
                  .then((tnewheight) => {
                    expect(theight).to.not.equal(tnewheight);
                    cy.get(".t--widget-containerwidget")
                      .eq(0)
                      .invoke("css", "height")
                      .then((newcheight) => {
                        expect(oheight).to.not.equal(newcheight);
                        cy.moveToContentTab();
                        const modifierKey =
                          Cypress.platform === "darwin" ? "meta" : "ctrl";
                        cy.get(".CodeMirror textarea")
                          .first()
                          .focus()
                          .type(`{${modifierKey}}a`)
                          .then(($cm) => {
                            if ($cm.val() !== "") {
                              cy.get(".CodeMirror textarea")
                                .first()
                                .clear({
                                  force: true,
                                });
                            }
                          });
                        cy.wait("@updateLayout");
                        cy.wait(4000);
                        cy.get(".t--widget-containerwidget")
                          .eq(0)
                          .invoke("css", "height")
                          .then((updatedcheight) => {
                            expect(oheight).to.equal(updatedcheight);
                          });
                      });
                  });
              });
          });
      });
  });
});
