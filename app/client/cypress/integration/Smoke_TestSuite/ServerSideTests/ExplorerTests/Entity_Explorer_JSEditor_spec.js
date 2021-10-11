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
    cy.get(`.t--entity.t--jsaction:contains(JSObject1)`).should(
      "have.length",
      1,
    );
    cy.get(`.t--entity.t--jsaction:contains(JSObject1)`)
      .find(explorer.collapse)
      .click({ multiple: true });
    cy.get(jsEditorLocators.propertyList).then(function($lis) {
      expect($lis).to.have.length(2);
      expect($lis.eq(0)).to.contain("{{JSObject1.run()}}");
      expect($lis.eq(1)).to.contain("{{JSObject1.results}}");
    });
  });

  // it("Rename JSObject", function() {
  //   cy.get(jsEditorLocators.jsObjectName).click();
  //   cy.get(jsEditorLocators.editNameField)
  //     .clear()
  //     .type("NewNameJSObj");
  //   cy.get(jsEditorLocators.jsPage).click();
  //   cy.get(jsEditorLocators.jsObjectName).contains("NewNameJSObj");
  // });

  // it("Copy JSObject", function() {
  //   cy.xpath(jsEditorLocators.popover)
  //     .last()
  //     .should("be.hidden")
  //     .invoke("show")
  //     .click({ force: true });

  //   cy.copyJSObjectToPage(pageid);
  // });

  // it("Delete JSObject", function() {
  //   cy.deleteJSObject("NewNameJSObj");
  // });
});
