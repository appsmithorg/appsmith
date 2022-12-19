const dsl = require("../../../../fixtures/textWidgetDynamicdsl.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Dynamic Height Width validation for text widget", function() {
  before(() => {
    cy.addDsl(dsl);
  });
  it("Text widget validation of height with dynamic height feature", function() {
    const textMsg = "Dynamic panel validation for text widget wrt height";
    //changing the Text Name and verifying
    cy.openPropertyPane("textwidget");
    cy.get(commonlocators.generalSectionHeight).should("be.visible");
    cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
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
          });
        cy.PublishtheApp();
        cy.get(commonlocators.headingTextStyle)
          .should("have.text", textMsg)
          .should("have.css", "font-size", "16px");
        cy.get(".t--widget-textwidget")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
  });
});
