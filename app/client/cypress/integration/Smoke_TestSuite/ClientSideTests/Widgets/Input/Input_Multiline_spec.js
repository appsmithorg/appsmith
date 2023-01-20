const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");

describe("Input Widget Multiline feature", function() {
  it("1. Single-line text with different heights i.e. Auto height and Fixed", () => {
    const textMsg = "Dynamic panel validation for input widget wrt height";
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    //verify fixed height is selected
    cy.get(commonlocators.generalSectionHeight)
      .scrollIntoView()
      .should("be.visible");
    cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((theight) => {
        //Changing the text label
        cy.testCodeMirror(textMsg);
        cy.wait(3000);
        cy.moveToStyleTab();
        cy.ChangeTextStyle("XL", commonlocators.headingTextStyle, textMsg);
        cy.wait("@updateLayout");
        cy.wait(2000);
        cy.get(".t--widget-inputwidgetv2")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
    // same in preview mode
    cy.get(commonlocators.deleteWidget).click();
    cy.wait("@updateLayout");
  });

  it("2. Multi-line text with different heights i.e. Auto height, Auto height with limit and Fixed", () => {
    const textMsg = "Dynamic panel validation for input widget wrt height";
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
    cy.openPropertyPane("inputwidgetv2");
    cy.get(widgetsPage.datatype)
      .last()
      .click({ force: true });
    cy.get("[data-cy='t--dropdown-option-Multi-line text']").click();

    // verify height changes to auto height

    // verify on addding long text inside input field, widget height changes
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((theight) => {
        //Changing the text label
        cy.testCodeMirror(textMsg);
        cy.wait(3000);
        cy.get(".t--widget-inputwidgetv2")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.not.equal(tnewheight);
          });
      });
    // verify changing label size also changes widget's height
    cy.get(commonlocators.generalSectionHeight)
      .scrollIntoView()
      .should("be.visible");
    // cy.get(commonlocators.datatype).find('span').should('contain.text', 'Single-line text')
    cy.changeLayoutHeightWithoutWait(commonlocators.autoHeight);
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((height) => {
        //Changing the text label
        cy.moveToStyleTab();
        cy.ChangeTextStyle("XL", commonlocators.headingTextStyle, textMsg);
        cy.wait("@updateLayout");
        cy.wait(2000);
        cy.get(".t--widget-inputwidgetv2")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height).to.not.equal(newheight);
          });
      });
    // select height as fixed for multiline datatype
    cy.openPropertyPane("inputwidgetv2");
    cy.get(widgetsPage.datatype)
      .last()
      .click({ force: true });
    cy.changeLayoutHeightWithoutWait(commonlocators.fixed);
    // change Label font size and verify
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((height) => {
        //Changing the text label
        cy.moveToStyleTab();
        cy.ChangeTextStyle("S", commonlocators.headingTextStyle, textMsg);
        cy.wait("@updateLayout");
        cy.wait(2000);
        cy.get(".t--widget-inputwidgetv2")
          .invoke("css", "height")
          .then((newheight) => {
            expect(height).to.equal(newheight);
          });
      });
    // adding long text for the input field
    cy.moveToContentTab();
    cy.get(".t--widget-inputwidgetv2")
      .invoke("css", "height")
      .then((theight) => {
        cy.testCodeMirror(textMsg + textMsg);
        cy.wait(3000);
        cy.get(".t--widget-inputwidgetv2")
          .invoke("css", "height")
          .then((tnewheight) => {
            expect(theight).to.equal(tnewheight);
          });
      });
    cy.get(commonlocators.deleteWidget).click();
    cy.wait("@updateLayout");
  });

  it("3. Enter key behaviour with single line and multi line selection", () => {
    cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
  });

  it("4.Check Default selection on first drop", () => {
    // -> The default mode on the first drop should always be FIXED
    //  -> On Changing the data type to Multi-line, auto height should be enabled(Check Properties and widget behaviour)
    //-> When changing the input type to multi-line, we check if height value is FIXED, if it is, then it changes to "Auto Height", otherwise, it stays the same.
  });
});
