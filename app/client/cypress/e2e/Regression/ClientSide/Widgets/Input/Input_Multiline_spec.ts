const commonlocators = require("../../../../../locators/commonlocators.json");
const widgetsPage = require("../../../../../locators/Widgets.json");
import {
  WIDGET,
  PROPERTY_SELECTOR,
} from "../../../../../locators/WidgetLocators";
import homePage from "../../../../../locators/HomePage";

describe(
  "Input Widget Multiline feature",
  { tags: ["@tag.Widget", "@tag.Input", "@tag.Binding"] },
  function () {
    const modifierKey = Cypress.platform === "darwin" ? "meta" : "ctrl";
    it("1. Single-line text with different heights i.e. Auto height and Fixed", () => {
      const textMsg = "Dynamic panel validation for input widget wrt height";
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 300 });
      //verify fixed height is selected
      cy.get(commonlocators.generalSectionHeight)
        .scrollIntoView()
        .should("be.visible");
      cy.selectDropdownValue(commonlocators.heightDropdown, "Auto Height");
      cy.get(".t--widget-inputwidgetv2")
        .invoke("css", "height")
        .then((theight) => {
          //Changing the text label
          cy.testCodeMirror(textMsg);
          cy.wait(3000);
          cy.moveToStyleTab();
          cy.get(commonlocators.dropDownIcon).last().click();
          cy.get(".t--dropdown-option").children().contains("XL").click();
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
      cy.selectDropdownValue(widgetsPage.datatype, "Multi-line text");
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
      cy.selectDropdownValue(commonlocators.heightDropdown, "Auto Height");
      cy.get(".t--widget-inputwidgetv2")
        .invoke("css", "height")
        .then((height) => {
          //Changing the text label
          cy.moveToStyleTab();
          cy.get(commonlocators.dropDownIcon).last().click();
          cy.get(".t--dropdown-option").children().contains("XL").click();

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
      cy.moveToContentTab();
      cy.get(widgetsPage.datatype).last().click({ force: true });
      cy.selectDropdownValue(commonlocators.heightDropdown, "Fixed");
      // change Label font size and verify
      cy.get(".t--widget-inputwidgetv2")
        .invoke("css", "height")
        .then((height) => {
          //Changing the text label
          cy.moveToStyleTab();
          cy.get(commonlocators.dropDownIcon).last().click();
          cy.get(".t--dropdown-option").children().contains("S").click();

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
      cy.dragAndDropToCanvas("inputwidgetv2", { x: 300, y: 500 });
      cy.openPropertyPane(WIDGET.INPUT_V2);
      cy.get(PROPERTY_SELECTOR.onSubmit).find(".t--js-toggle").click();
      cy.updateCodeInput(
        PROPERTY_SELECTOR.onSubmit,
        "{{showAlert('Success')}}",
      );
      // enter some text and hit enter
      cy.get(".t--draggable-inputwidgetv2")
        .find("input")
        .type("hi")
        .type("{enter}");
      // verify toast message on enter
      cy.get(homePage.toastMessage).should("contain", "Success");
      // enter key with multiline
      cy.selectDropdownValue(widgetsPage.datatype, "Multi-line text");
      cy.get(".t--draggable-inputwidgetv2")
        .find("textarea")
        .first()
        .type("hi")
        .type("{enter}")
        .type("again")
        .type(`{${modifierKey}}{enter}`);
      // verify toast message on enter
      cy.get(homePage.toastMessage).should("contain", "Success");
    });
  },
);
