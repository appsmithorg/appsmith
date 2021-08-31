const explorer = require("../../../../locators/explorerlocators.json");
const jsEditorLocators = require("../../../../locators/JSEditor.json");
const commonlocators = require("../../../../locators/commonlocators.json");

describe("Entity explorer JSEditor structure", function() {
  beforeEach(() => {
    cy.ClearSearch();
  });

  it("Create and Run JSObject", function() {
    cy.createJSObject('return "Hello World";');
    cy.get(jsEditorLocators.outputConsole).contains("Hello World");
  });

  it("Rename JSObject", function() {
    //cy.get('.sc-jfkKcj').click();
    cy.get(jsEditorLocators.jsObjectName).click();
    cy.get(jsEditorLocators.editNameField)
      .clear()
      .type("NewNameJSObj");
    cy.get(jsEditorLocators.jsPage).click();
    cy.get(jsEditorLocators.jsObjectName).contains("NewNameJSObj");
  });

  it("Copy JSObject", function() {
    cy.get(jsEditorLocators.jsPageProperty).click();
    //cy.get('.sc-gKXCFs').click();
    cy.get(jsEditorLocators.copyToPageMenu).click();
    cy.get(jsEditorLocators.copyToPage1).click();
  });

  it("Delete JSObkect", function() {
    cy.get(`.t--entity-name:contains("NewNameJSObjCopy")`).click();
    cy.get(jsEditorLocators.jsPageProperty).click();
    cy.get(".t--apiFormDeleteBtn").click();
  });
});
