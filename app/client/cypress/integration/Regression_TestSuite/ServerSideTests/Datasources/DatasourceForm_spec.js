const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  dataSource = ObjectsRegistry.DataSources,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer;

describe("Datasource form related tests", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Check whether the number of key value pairs is equal to number of delete buttons", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI(); //Not giving name to enable for cypress re-attempt
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);

    cy.get(".t--store-as-datasource")
      .trigger("click")
      .wait(1000);

    agHelper.AssertElementAbsence(
      locator._specificToast("Duplicate key error"),
    ); //verifying there is no error toast, Bug 14566

    cy.get(".t--add-field")
      .first()
      .click();

    // Two array pairs for headers key,value should have 2 delete buttons as per new uqi designs, so the first header can also be deleted : Bug #14804
    cy.get(".t--headers-array .t--delete-field")
      .children()
      .should("have.length", 2);
  });

  it("2. Check if save button is disabled", function() {
    cy.get(".t--save-datasource").should("not.be.disabled");
    dataSource.SaveDSFromDialog();
  });

  it("3. Check if saved api as a datasource does not fail on cloning", function() {
    cy.NavigateToAPI_Panel();
    ee.ExpandCollapseEntity("Queries/JS");
    cy.get(".t--entity-name")
      .contains("Api")
      .trigger("mouseover");
    cy.hoverAndClickParticularIndex(1);
    cy.get('.single-select:contains("Copy to page")').click();
    cy.get('.single-select:contains("Page1")').click({ force: true });
    agHelper.AssertContains("action copied to page Page1 successfully");
  });
});
