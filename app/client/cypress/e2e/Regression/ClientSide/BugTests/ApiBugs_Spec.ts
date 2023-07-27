import {
  agHelper,
  locators,
  entityItems,
  apiPage,
  dataSources,
  debuggerHelper,
  tedTestConfig,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

import {
  ERROR_ACTION_EXECUTE_FAIL,
  createMessage,
} from "../../../../support/Objects/CommonErrorMessages";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("API Bugs", function () {
  before(() => {
    featureFlagIntercept(
      {
        ab_ds_binding_enabled: false,
      },
      false,
    );
    agHelper.RefreshPage();
  });
  it("1. Bug 14037: User gets an error even when table widget is added from the API page successfully", function () {
    apiPage.CreateAndFillApi(
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].mockApiUrl,
      "Api1",
    );
    apiPage.RunAPI();

    dataSources.AddSuggesstedWidget(Widgets.Table);

    debuggerHelper.AssertErrorCount(0);
  });

  it("2. Bug 16377, When Api url has dynamic binding expressions, ensure the url and path derived is not corrupting Api execution", function () {
    //Since the specified expression always returns true - it will never run mock-apis - which actually doesn't exist
    const apiUrl = `http://host.docker.internal:5001/v1/{{true ? 'mock-api' : 'mock-apis'}}?records=10`;

    apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
    apiPage.RunAPI();
    agHelper.AssertElementAbsence(
      locators._specificToast(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, "BindingExpressions"),
      ),
    ); //Assert that an error is not returned.
    apiPage.ResponseStatusCheck("200 OK");
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Api,
    });
  });

  it("3. Bug 18876 Ensures application does not crash when saving datasource", () => {
    apiPage.CreateAndFillApi(
      tedTestConfig.dsValues[tedTestConfig.defaultEnviorment].mockApiUrl,
      "FirstAPI",
      10000,
      "POST",
    );
    apiPage.SelectPaneTab("Authentication");
    cy.get(apiPage._saveAsDS).last().click({ force: true });
    cy.get(".t--close-editor").click({ force: true });
    cy.get(dataSources._datasourceModalSave).click();
    // ensures app does not crash and datasource is saved.
    cy.contains("Edit datasource to access authentication settings").should(
      "exist",
    );
  });

  it("4. Bug 16683, When Api url has dynamic binding expressions, ensures the query params is not truncated", function () {
    const apiUrl = `http://host.docker.internal:5001/v1/mock-api?records=4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}`;

    apiPage.CreateAndFillApi(apiUrl, "BindingExpressions");
    apiPage.ValidateQueryParams({
      key: "records",
      value: "4{{Math.random() > 0.5 ? '&param1=5' : '&param2=6'}}",
    });
  });
});
