describe("Copy JS objects to different pages", () => {
  it("copies JS object to a different page from the additional menu in Queries/JS section", () => {
    cy.Createpage("Page2");

    cy.get(".t--entity-item:contains(Page1)")
      .first()
      .click();
    cy.wait("@getPage");

    cy.createJSObject('return "Hello World";');

    cy.get(`.t--entity-item:contains('JSObject1')`).within(() => {
      cy.get(".t--context-menu").click({ force: true });
    });

    cy.selectAction("Copy to page");
    cy.get('.single-select:contains("Page2")').click({ force: true });

    cy.wait(2000);
    cy.validateToastMessage("JSObject1 copied to page Page2 successfully");
  });

  it("copies JS object to a different page from the additional menu on JS Editor page", () => {
    cy.Createpage("Page2");

    cy.createJSObject('return "Hello World";');
    cy.wait(3000);

    cy.get("[name='expand-more']")
      .eq(1)
      .click({ force: true });

    cy.get(".t--more-action-menu")
      .first()
      .click();

    cy.selectAction("Copy to page");
    cy.selectAction("Page1");
    cy.validateToastMessage("JSObject1 copied to page Page1 successfully");
  });
});
