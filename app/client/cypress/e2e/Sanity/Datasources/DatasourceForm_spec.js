const testdata = require("../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper,
  dataSource = ObjectsRegistry.DataSources,
  locator = ObjectsRegistry.CommonLocators,
  ee = ObjectsRegistry.EntityExplorer,
  apiPage = ObjectsRegistry.ApiPage;

describe("Datasource form related tests", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Check whether the number of key value pairs is equal to number of delete buttons", function () {
    cy.NavigateToAPI_Panel();

    apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
    cy.get(".t--store-as-datasource").click();

    agHelper.AssertElementAbsence(
      locator._specificToast("Duplicate key error"),
    ); //verifying there is no error toast, Bug 14566

    cy.get(".t--add-field").first().click();

    // Two array pairs for headers key,value should have 2 delete buttons as per new uqi designs, so the first header can also be deleted : Bug #14804
    cy.get(".t--headers-array .t--delete-field")
      .children()
      .should("have.length", 2);
    // Check if save button is disabled
    cy.get(".t--save-datasource").should("not.be.disabled");
    dataSource.SaveDSFromDialog();
    //Check if saved api as a datasource does not fail on cloning", function () {
    cy.NavigateToAPI_Panel();
    ee.ExpandCollapseEntity("Queries/JS");
    ee.ActionContextMenuByEntityName("Api1", "Copy to page", "Page1");
    agHelper.AssertContains("action copied to page Page1 successfully");
  });
});
