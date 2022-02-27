const dsl = require("../../../../fixtures/modalScroll.json");

describe("Modal Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
    cy.wait(7000);
  });

  it("Open  Modal from button and test scroll", () => {
    cy.PublishtheApp();
    cy.get(".t--widget-buttonwidget button").click({ force: true });
    cy.get(".t--modal-widget").should("exist");
    cy.get(".t--modal-widget").scrollTo("bottom");
  });
});
