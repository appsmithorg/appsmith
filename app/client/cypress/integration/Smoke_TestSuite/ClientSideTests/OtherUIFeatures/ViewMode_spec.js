const dsl = require("../../../../fixtures/previewMode.json");
var appId = " ";
const BASE_URL = Cypress.config().baseUrl;

describe("Preview mode functionality", function() {
   before(() => {
    appId = localStorage.getItem("applicationId");
    cy.log("appID:"+appId);
    cy.addDsl(dsl, appId);
  });

  it("on click of apps on header, it should take to application home page", function() {
    cy.PublishtheApp();

    cy.get(".t--back-to-home").click();
    cy.url().should("eq", BASE_URL + "applications");
  });
});
