const dsl = require("../../../../fixtures/displayWidgetDsl.json");
var appId = " ";

describe("Entity explorer tests related to pinning and unpinning", function() {
  before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
  });

  beforeEach(() => {
    cy.addDsl(dsl, appId);
  });

  it("checks entity explorer visibility on unpin", function() {
    cy.wait(5000);
    cy.get(".t--entity-explorer").should("be.visible");
    cy.get(".t--pin-entity-explorer").click();
    cy.wait(5000);
    cy.get("[data-testid=widgets-editor]").click({ force: true });
    cy.wait(3000);
    cy.get(".t--entity-explorer").should("not.be.visible");
  });

  it("checks entity explorer visibility on pin", function() {
    cy.get(".t--pin-entity-explorer").click();
    cy.get(".t--entity-explorer").should("be.visible");
  });
});
