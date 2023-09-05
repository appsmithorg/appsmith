import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

import {
  agHelper,
  apiPage,
  dataSources,
  locators,
  dataManager,
  propPane,
  multipleEnv,
  entityExplorer,
  draggableWidgets,
  deployMode,
} from "../../../../support/ee/ObjectsCore_EE";

const GRAPHQL_QUERY = `query ($myid: Int!) {
	postById(id: $myid) {
	  id,
    title,
    content
  }
}`;

let POST_ID = 6;

let GRAPHQL_VARIABLES = `{
    "myid": ${POST_ID}
  }`;

describe(
  "excludeForAirgap",
  "GraphQL Datasource for Staging & Prod verifications",
  function () {
    let prodEnv: string,
      stagingEnv: string,
      authDsName: string,
      apiName: string;

    before(() => {
      // Need to remove the previous user preference for the callout
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      prodEnv = dataManager.defaultEnviorment;
      stagingEnv = dataManager.environments[1];
      multipleEnv.SwitchEnv(prodEnv);
    });

    it("1. Validate Authenticated GraphQL with Empty body & then Save as Datasource + Bug #26873", () => {
      dataSources.CreateDataSource(
        "AuthenticatedGraph",
        true,
        false,
        prodEnv,
        true,
      );
      agHelper.AssertElementVisibility(
        locators._visibleTextSpan("Production Environment"),
      );
      agHelper.AssertElementAbsence(
        locators._visibleTextSpan("Staging Environment"),
      );

      dataSources.EditDatasource();
      agHelper.GetNClick(dataSources._stagingTab);
      dataSources.FillAuthenticatedGrapgQLURL();
      dataSources.SaveDatasource(false, true);
      agHelper.AssertContains("datasource updated successfully");

      agHelper.AssertElementVisibility(
        locators._visibleTextSpan("Production Environment"),
      );
      agHelper.AssertElementVisibility(
        locators._visibleTextSpan("Staging Environment"),
      );
      cy.get("@dsName").then(($dsName: any) => {
        authDsName = $dsName.toString();
        dataSources.NavigateToDSCreateNew();

        dataSources.FillUnAuthenticatedGraphQLDSForm(
          dataManager.defaultEnviorment,
          "select",
          authDsName,
        );
        cy.get("@dsName").then(($dsName: any) => {
          apiName = $dsName.toString();
          agHelper.ContainsNClick(authDsName);

          dataSources.UpdateGraphqlQueryAndVariable({
            query: GRAPHQL_QUERY,
            variable: GRAPHQL_VARIABLES,
          });

          apiPage.RunAPI();
          apiPage.ResponseStatusCheck("200");
          entityExplorer.DragDropWidgetNVerify(draggableWidgets.TEXT);
          propPane.UpdatePropertyFieldValue(
            "Text",
            `{{${apiName}` + `.data}}}`,
          );
        });
      });
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.TEXT),
        true,
        true,
        true,
        "present",
      );
      agHelper
        .GetText(locators._widgetInDeployed(draggableWidgets.TEXT) + " span")
        .should("not.be.empty");
    });
  },
);
