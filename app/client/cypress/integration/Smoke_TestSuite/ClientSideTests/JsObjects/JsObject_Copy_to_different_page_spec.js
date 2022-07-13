const jsEditorLocators = require("../../../../locators/JSEditor.json");
const commonLocators = require("../../../../locators/commonlocators.json");

describe("Copy JS objects to different pages", () => {
  it("copies JS object to a different page from the additional menu in Queries/JS section", () => {
    cy.Createpage("Page2");

    cy.get(`${commonLocators.entityItem}:contains(Page1)`)
      .first()
      .click();
    cy.wait("@getPage");

    cy.createJSObject('return "Hello World";');

    cy.get(`${commonLocators.entityItem}:contains('JSObject1')`).within(() => {
      cy.get(commonLocators.entityContextMenu).click({ force: true });
    });

    cy.selectAction("Copy to page");
    cy.get(`${commonLocators.chooseAction}:contains("Page2")`).click({
      force: true,
    });

    cy.wait(2000);
    cy.validateToastMessage("JSObject1 copied to page Page2 successfully");
  });

  it("copies JS object to a different page from the additional menu on JS Editor page", () => {
    cy.Createpage("Page2");

    cy.createJSObject('return "Hello World";');
    cy.wait(3000);

    cy.get(commonLocators.expandMore)
      .eq(1)
      .click({ force: true });

    cy.get(jsEditorLocators.jsActionMenu)
      .first()
      .click();

    cy.selectAction("Copy to page");
    cy.selectAction("Page1");
    cy.validateToastMessage("JSObject1 copied to page Page1 successfully");
  });
});
