const dsl = require("../../../../../fixtures/IframeDsl.json");

describe("Iframe Widget functionality", function() {
  before(() => {
    cy.addDsl(dsl);
  });

  const getIframeBody = () => {
    // get the iframe > document > body
    // and retry until the body element is not empty
    return (
      cy
        .get(".t--draggable-iframewidget iframe")
        .its("0.contentDocument.body")
        .should("not.be.empty")
        // wraps "body" DOM element to allow
        // chaining more Cypress commands, like ".find(...)"
        // https://on.cypress.io/wrap
        .then(cy.wrap)
    );
  };

  it("Tests Iframe post message props correctly exposed or not", () => {
    cy.wait(3000);
    getIframeBody()
      .find("button")
      .should("have.text", "Click me")
      .click();
    cy.wait(1000);
    cy.get(".t--draggable-textwidget .bp3-ui-text span").should(
      "contain.text",
      `{"lastEventId":"","origin":"https://dev.appsmith.com","ports":[]}`,
    );
  });
});
