const explorer = require("../../../../locators/explorerlocators.json");
const jsEditorLocators = require("../../../../locators/JSEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");

const pageid = "Page1";

describe("Entity explorer JSEditor structure", function() {
  beforeEach(() => {
    cy.ClearSearch();
  });

  it("Create and Run JSObject", function() {
    cy.createJSObject('return "Hello World";');
    cy.get(jsEditorLocators.outputConsole).contains("Hello World");
  });

  /* it("Rename JSObject", function() {
    //cy.get('.sc-jfkKcj').click();
    cy.get(jsEditorLocators.jsObjectName).click();
    cy.get(jsEditorLocators.editNameField)
      .clear()
      .type("NewNameJSObj");
    cy.get(jsEditorLocators.jsPage).click();
    cy.get(jsEditorLocators.jsObjectName).contains("NewNameJSObj");
  });*/

  it("Copy JSObject", function() {
    cy.xpath(jsEditorLocators.popover)
      .last()
      .should("be.hidden")
      .invoke("show")
      .click({ force: true });

    cy.copyJSObjectToPage(pageid);
  });
});
