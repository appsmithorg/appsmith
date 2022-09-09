const testdata = require("../../../../fixtures/testdata.json");
import { ObjectsRegistry } from "../../../../support/Objects/Registry";

let agHelper = ObjectsRegistry.AggregateHelper;

describe("Create a rest datasource", function() {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("Create a rest datasource + Bug 14566", function() {
    cy.NavigateToAPI_Panel();
    cy.CreateAPI();
    cy.enterDatasourceAndPath(testdata.baseUrl, testdata.methods);
    cy.assertPageSave();
    cy.get(".t--store-as-datasource")
      .trigger("click")
      .wait(1000);
    agHelper.ValidateToastMessage("datasource created"); //verifying there is no error toast, Bug 14566
    cy.testSelfSignedCertificateSettingsInREST(false);
    cy.saveDatasource();
    cy.contains(".datasource-highlight", "https://mock-api.appsmith.com");
    cy.SaveAndRunAPI();
  });
});
