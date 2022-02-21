const testdata = require("../../../../fixtures/testdata.json");

describe("Datasource form related tests", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Check whether the delete button has the right color", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI("Testapi");
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);

    cy.get(".t--store-as-datasource").click();

    cy.get(".t--add-field")
      .first()
      .click();
    cy.get(".t--delete-field").should("attr", "color", "#A3B3BF");
  });
  it("Check if save button is disabled", function() {
    cy.get(".t--save-datasource").should("not.be.disabled");
  });

  it("Check if saved api as a datasource does not fail on cloning", function() {
    cy.NavigateToAPI_Panel();
    cy.get(".t--entity-name")
      .contains("Testapi")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.get('.single-select:contains("Copy to page")').click();
    cy.get('.single-select:contains("Page1")').click();
    cy.validateToastMessage("Testapi action copied to page Page1 successfully");
  });
});
