import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { Widgets } from "../../../../support/Pages/DataSources";
import {
  agHelper,
  apiPage,
  dataManager,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  multipleEnv,
} from "../../../../support/ee/ObjectsCore_EE";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let meDatasourceName: string,
  meQueryName: string,
  prodEnv: string,
  stagingEnv: string,
  APIName: any;

describe(
  "excludeForAirgap",
  "Multiple environment datasource creation and test flow",
  function () {
    before(() => {
      // Need to remove the previous user preference for the callout
      window.localStorage.removeItem("userPreferenceDismissEnvCallout");
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      prodEnv = dataManager.defaultEnviorment;
      stagingEnv = dataManager.environments[1];
      multipleEnv.SwitchEnv(prodEnv);
      meQueryName = "rest_select";
    });

    it("1. Creates a new Authenticated API ds for both envs", function () {
      dataSources.NavigateToDSCreateNew();
      agHelper.GetNClick(dataSources._authApiDatasource, 0, true);
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        APIName = uid;
        agHelper.RenameWithInPane(APIName, false);
      });
      // Fill Auth Form
      agHelper.TypeText(
        locators._inputFieldByName("URL") + "//" + locators._inputField,
        dataManager.dsValues[prodEnv].ApiUrlME,
      );
      agHelper.Sleep(500);
      dataSources.SaveDatasource(false, true);
      // Add staging env details
      dataSources.EditDatasource();
      multipleEnv.SwitchEnvInDSEditor(stagingEnv);
      // Enter wrong values and test
      agHelper.TypeText(
        locators._inputFieldByName("URL") + "//" + locators._inputField,
        dataManager.dsValues[stagingEnv].ApiUrlME,
      );
      // Save env details
      dataSources.SaveDatasource(false, true);
    });

    it("2. Create and test query responses for both ds on both environmets and add to a table", function () {
      // Create a query on the ME ds
      dataSources.CreateQueryAfterDSSaved();
      cy.get(apiPage._editorDS).type("/getResponse");
      agHelper.Sleep();
      apiPage.RunAPI();
      // Check both query responses on staging
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.Sleep();
      apiPage.RunAPI();
      dataSources.AddSuggestedWidget(Widgets.Table);
    });

    it("3. Check table response for both environments", function () {
      // Check the records on the table
      cy.get(locators._tableRecordsContainer).should("contain", "2 Records");
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      multipleEnv.SwitchEnv(prodEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "1 Record");
    });

    it("4. Deploy the app, check for modal and check table response for both envs", function () {
      // Need to remove the previous user preference for the callout
      window.localStorage.removeItem("userPreferenceDismissEnvCallout");
      agHelper.Sleep();
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.TABLE),
        true,
        true,
        true,
      );
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      // Check for env switcher
      agHelper.AssertElementExist(multipleEnv.env_switcher);
      // Check table values
      multipleEnv.SwitchEnv(prodEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "1 Records");
      multipleEnv.SwitchEnv(stagingEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "2 Records");
      deployMode.NavigateBacktoEditor();
      multipleEnv.SwitchEnv(prodEnv);
      // Clean up
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1",
        action: "Delete",
        entityType: entityItems.Widget,
      });
    });
  },
);
