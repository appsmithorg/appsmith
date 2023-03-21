const dsl = require("../../../../fixtures/DynamicHeightModalDsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation with limits", function () {
  it("Validate change in auto height with limits width for widgets and highlight section validation", function () {
    const textMsg =
      "Dynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt heightDynamic panel validation for text widget wrt height Dynamic panel validation for text widget Dynamic panel validation for text widget Dynamic panel validation for text widget";
    cy.addDsl(dsl);
    cy.wait(3000); //for dsl to settle
    cy.selectEntityByName("Modal1");
    cy.get(".t--modal-widget")
      .invoke("css", "height")
      .then((mheight) => {
        cy.openPropertyPane("textwidget");
        cy.get(commonlocators.generalSectionHeight).should("be.visible");
        cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
        cy.openPropertyPaneFromModal("textwidget");
        cy.get(".t--widget-textwidget")
          .invoke("css", "height")
          .then((theight) => {
            cy.testCodeMirror(textMsg);
            cy.wait("@updateLayout");
            cy.get(".t--widget-textwidget")
              .invoke("css", "height")
              .then((tnewheight) => {
                expect(theight).to.not.equal(tnewheight);
              });
            cy.selectEntityByName("Modal1");
            cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
            cy.wait(3000);
            cy.get(".t--modal-widget")
              .invoke("css", "height")
              .then((mnewheight) => {
                expect(mheight).to.not.equal(mnewheight);
              });
          });
      });
  });
});
