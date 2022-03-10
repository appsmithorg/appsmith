const dsl = require("../../../../fixtures/modalScroll.json");

describe("Modal Widget Functionality", function() {
  before(() => {
    cy.addDsl(dsl);
    cy.wait(7000);
  });

  it("1. [Bug]- 11415 - Open  Modal from button and test scroll", () => {
    cy.PublishtheApp();
    cy.get(".t--widget-buttonwidget button").click({ force: true });
    cy.get(".t--modal-widget").should("exist");
    cy.get("span:contains('Close')").should("not.be.visible");
    cy.get(".t--modal-widget")
      .scrollTo("bottom")
      .wait(1000);
    cy.get("span:contains('Close')").should("be.visible");
    cy.get(".t--modal-widget").scrollTo("top");
    cy.get("span:contains('Close')").should("not.be.visible");
  });
});
