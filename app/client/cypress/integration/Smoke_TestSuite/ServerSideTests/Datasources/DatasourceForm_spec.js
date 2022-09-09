const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper;

describe("Datasource form related tests", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Check whether the delete button has the right color", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(); //Not giving name to enable for cypress re-attempt
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);

    cy.get(".t--store-as-datasource")
      .trigger("click")
      .wait(1000);
    agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566

    cy.get(".t--add-field")
      .first()
      .click();
    cy.get(".t--delete-field").should("attr", "color", "#A3B3BF");
  });

  it("2. Check if save button is disabled", function() {
    cy.get(".t--save-datasource").should("not.be.disabled");
  });

  it("3. Check if saved api as a datasource does not fail on cloning", function() {
    cy.NavigateToAPI_Panel();
    cy.get(".t--entity-name")
      .contains("Api")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.get('.single-select:contains("Copy to page")').click();
    cy.get('.single-select:contains("Page1")').click({ force: true });
    cy.validateToastMessage("action copied to page Page1 successfully");
  });
});
