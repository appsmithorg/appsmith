import ApiEditor from "../../../../locators/ApiEditor";
import {
  apiPage,
  agHelper,
  dataManager,
  assertHelper,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "API Panel request body",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Ensure that the run button is disabled when there are empty fields.", function () {
      apiPage.CreateApi("FirstAPI");
      apiPage.AssertRunButtonDisability(true);
    });

    it('2. Validate we get an appropriate error message when an invalid URL is entered. Error should show up when nothing is entered & we click on "Import".', function () {
      apiPage.CreateAndFillApi(
        "htt://failedurlfortest",
        "WhatTrumpThinks",
        "SecondAPI",
      );
      agHelper.GetNClick(apiPage._apiRunBtn, 0, true, 10000);
      apiPage.ResponseStatusCheck("PE-RST-5000");
    });

    // Cypress issue: https://github.com/cypress-io/cypress/issues/8267
    it("3. Validate keyboard navigation e.g. Cmd + Enter should trigger the Run button", function () {
      apiPage.CreateAndFillApi(
        dataManager.dsValues[dataManager.defaultEnviorment].randomTrumpApi,
        "WhatTrumpThinks",
        "ThirdAPI",
      );
      agHelper.GetNClick(ApiEditor.dataSourceField, 0, true);
      cy.get(ApiEditor.dataSourceField).type(
        this.isMac ? "{cmd}{enter}" : "{ctrl}{enter}",
        {
          release: false,
        },
      );
      assertHelper.AssertNetworkStatus("@postExecute");
    });
  },
);
