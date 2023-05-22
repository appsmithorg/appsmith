const dsl = require("../../../../../fixtures/modalScroll.json");

describe("Modal Widget Functionality", function () {
  before(() => {
    cy.addDsl(dsl);
    cy.wait(7000);
  });

  it("1. [Bug]- 11415 - Open  Modal from button and test scroll", () => {
    cy.PublishtheApp();
    cy.wait(1000);
    cy.get("span:contains('Submit')").closest("div").click();
    cy.get(".t--modal-widget").should("exist");
    cy.get("span:contains('Close')").closest("div").should("not.be.visible");
    cy.get(".t--modal-widget").then(($el) => $el[0].scrollTo(0, 500));

    cy.get("span:contains('Close')").closest("div").should("be.visible");
    cy.get(".t--modal-widget").then(($el) => $el[0].scrollTo(0, 0));
    cy.get("span:contains('Close')").closest("div").should("not.be.visible");
  });
});
