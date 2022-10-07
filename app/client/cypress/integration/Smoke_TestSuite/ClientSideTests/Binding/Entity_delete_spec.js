const dsl = require("../../../../fixtures/SimpleBinding.json");
const widgetsPage = require("../../../../locators/Widgets.json");
var appId = " ";

describe("Binding the multiple widgets and validating default data", function() {
  before(() => {
    //appId = localStorage.getItem("applicationId");
    //cy.log("appID:" + appId);
    cy.addDsl(dsl);
  });

  it("Checks if delete will remove bindings", function() {
    cy.get(widgetsPage.textWidget)
      .first()
      .click({ force: true });
    cy.get("body").type("{del}", { force: true });

    cy.get(widgetsPage.textWidget)
      .first()
      .should("not.have.text", "Label");
  });
});
