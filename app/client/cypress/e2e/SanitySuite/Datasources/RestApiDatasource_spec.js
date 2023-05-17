const testdata = require("../../../fixtures/testdata.json");
import * as _ from "../../../support/Objects/ObjectsCore";

describe("Create a rest datasource", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a rest datasource + Bug 14566", function () {
    _.apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
    cy.get(".t--store-as-datasource").click();
    _.agHelper.AssertElementAbsence(
      _.locators._specificToast("Duplicate key error"),
    ); //verifying there is no error toast, Bug 14566
    cy.testSelfSignedCertificateSettingsInREST(false);
    cy.saveDatasource();
    cy.contains(".datasource-highlight", "http://host.docker.internal:5001"); //failing here since Save as Datasource is broken
    cy.SaveAndRunAPI();
  });
});
