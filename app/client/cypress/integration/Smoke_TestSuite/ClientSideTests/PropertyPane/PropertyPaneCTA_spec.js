const dsl = require("../../../../fixtures/TextTabledsl.json");
var appId = " ";

describe("Property pane CTA to add an action", function() {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });

  it("Check if CTA is shown when there is no action", function() {
    cy.openPropertyPane("tablewidget");

    cy.get(".t--propertypane-connect-cta")
      .scrollIntoView()
      .should("be.visible");
  });

  it("Check if CTA does not exist when there is an action", function() {
    cy.NavigateToAPI_Panel();

    cy.CreateAPI("FirstAPI");
    cy.SearchEntityandOpen("Table1");
    cy.get(".t--propertypane-connect-cta").should("not.exist");
  });
});
