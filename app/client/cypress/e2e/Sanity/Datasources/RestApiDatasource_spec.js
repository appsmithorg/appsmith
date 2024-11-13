const testdata = require("../../../fixtures/testdata.json");
import {
  agHelper,
  locators,
  apiPage,
} from "../../../support/Objects/ObjectsCore";

describe(
  "Create a rest datasource",
  {
    tags: ["@tag.Datasource", "@tag.Sanity", "@tag.Git", "@tag.AccessControl"],
  },
  function () {
    it("1. Create a rest datasource + Bug 14566", function () {
      apiPage.CreateAndFillApi(testdata.baseUrl + testdata.methods);
      agHelper.WaitUntilEleAppear(apiPage._saveAsDS);
      cy.get(apiPage._saveAsDS).click({ force: true });
      //verifying there is no error toast, Bug 14566
      agHelper.AssertElementAbsence(
        locators._specificToast("Duplicate key error"),
      );
      cy.testSelfSignedCertificateSettingsInREST(false);
      cy.get("body").then((body) => {
        if (
          body.find('[value="http://host.docker.internal:5001"]').length < 1
        ) {
          cy.get('[placeholder="https://example.com"]').type(
            "http://host.docker.internal:5001",
          );
        }
      });
      cy.saveDatasource();
      cy.contains(".datasource-highlight", "http://host.docker.internal:5001");
      cy.SaveAndRunAPI();
    });
  },
);
