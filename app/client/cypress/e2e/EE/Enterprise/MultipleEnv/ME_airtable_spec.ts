import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  dataManager,
  dataSources,
  deployMode,
  draggableWidgets,
  entityExplorer,
  entityItems,
  locators,
  multipleEnv,
  propPane,
} from "../../../../support/ee/ObjectsCore_EE";
import EditorNavigation, {
  EntityType,
} from "../../../../support/Pages/EditorNavigation";

let oosDatasourceName: string,
  oosQueryName: string,
  prodEnv: string,
  oosQueryResponseLength: number,
  stagingEnv: string,
  TABLE_DATA_STATIC: string;

describe(
  "Multiple environment datasource creation and test flow",
  { tags: ["@tag.Datasource", "@tag.excludeForAirgap"] },
  function () {
    before(() => {
      // Need to remove the previous user preference for the callout
      window.localStorage.removeItem("userPreferenceDismissEnvCallout");
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      prodEnv = dataManager.defaultEnviorment;
      stagingEnv = dataManager.environments[1];
      multipleEnv.SwitchEnv(prodEnv);
      oosQueryName = "airtable_select";
      TABLE_DATA_STATIC = `{{${oosQueryName}.data.records}}`;
    });

    it("1. Creates a new OOS datasource (airtable) only for prod", function () {
      //Create airtable datasource
      dataSources.CreateDataSource("Airtable", true, false, prodEnv, true);
      cy.get("@dsName").then(($dsName) => {
        oosDatasourceName = $dsName.toString();
      });
      dataSources.EditDatasource();
      // Ensure that staging is disabled
      agHelper.AssertAttribute(
        locators.ds_editor_env_filter(stagingEnv),
        "aria-disabled",
        "true",
      );
      // Ensure disabled icon is also present
      agHelper.AssertElementExist(multipleEnv.ds_data_filter_disabled);
      agHelper.GoBack();
      agHelper.AssertElementVisibility(dataSources._activeDS);
    });

    it("2. Create and test query responses for both ds on both environmets and add to a table", function () {
      // Create a query on the OOS ds
      dataSources.CreateQueryForDS(oosDatasourceName);
      agHelper.RenameWithInPane(oosQueryName, true);
      //List all records
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Please select an option",
        "List records",
      );

      agHelper.EnterValue(dataManager.dsValues[prodEnv].AirtableBaseForME, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Base ID ",
      });
      agHelper.EnterValue(dataManager.dsValues[prodEnv].AirtableTableForME, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Table name",
      });

      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        oosQueryResponseLength = resObj.response.body.data.body.records.length;
        cy.log(
          `OOS query for env ${prodEnv} has ${oosQueryResponseLength} records`,
        );
      });

      // Check both query responses on staging
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.Sleep();

      // Running airtable query on staging
      dataSources.RunQuery();
      cy.get("@postExecute").then((resObj: any) => {
        const stagingOOSQueryResponseLength =
          resObj.response.body.data.body.records.length;
        cy.log(
          `OOS query for env ${stagingEnv} has ${stagingOOSQueryResponseLength} records`,
        );
        expect(stagingOOSQueryResponseLength).to.equal(oosQueryResponseLength);
      });
    });

    it("3. Check table response for both environments", function () {
      // Add a table widget on canvas
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE, 500, 300);
      propPane.EnterJSContext("Table data", TABLE_DATA_STATIC);
      // Check the records on the table
      cy.get(locators._tableRecordsContainer).should(
        "contain",
        `${oosQueryResponseLength} Records`,
      );
      //Navigate to the table widget
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      multipleEnv.SwitchEnv(prodEnv);
      //[Done]TODO: move to common locators
      cy.get(locators._tableRecordsContainer).should(
        "contain",
        `${oosQueryResponseLength} Records`,
      );
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
      cy.get(locators._tableRecordsContainer).should(
        "contain",
        `${oosQueryResponseLength} Records`,
      );
      multipleEnv.SwitchEnv(stagingEnv);
      cy.get(locators._tableRecordsContainer).should(
        "contain",
        `${oosQueryResponseLength} Records`,
      );
      deployMode.NavigateBacktoEditor();
      multipleEnv.SwitchEnv(prodEnv);
      // Clean up
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1",
        action: "Delete",
        entityType: entityItems.Widget,
      });
      dataSources.DeleteQuery(oosQueryName);
      // Won't be deleting the ds since it is being used by a query in deploy mode
    });

    // TODO: assert data from query in OOS is same for both stage and prod
    // TODO: add CRUD page tests
  },
);
