import { featureFlagIntercept } from "../../../support/Objects/FeatureFlags";
import {
  agHelper,
  dataSources,
  deployMode,
  entityExplorer,
  homePage,
  locators,
  tedTestConfig,
} from "../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../support/Pages/DataSources";
import { EntityItems } from "../../../support/Pages/AssertHelper";
import { multipleEnv } from "../../../support/ee/ObjectsCore_EE";
const OnboardingLocator = require("../../../locators/FirstTimeUserOnboarding.json");

let meDatasourceName: string,
  oosDatasourceName: string,
  meQueryName: string,
  oosQueryName: string,
  prodEnv: string,
  oosQueryResponseLength: number,
  stagingEnv: string;

describe(
  "excludeForAirgap",
  "Multiple environment datasource creation and test flow",
  function () {
    before(() => {
      homePage.SignUp("me-qa2@appsmith.com", "test123");
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      agHelper.GetNClick(OnboardingLocator.introModalCloseBtn);
      prodEnv = tedTestConfig.defaultEnviorment;
      stagingEnv = tedTestConfig.environments[1];
      multipleEnv.SwitchEnv(prodEnv);
      meQueryName = "postgres_select";
      oosQueryName = "airtable_select";
    });

    it("1. Check if environment switcher is active", function () {
      // Make sure the environment switcher is visible
      cy.get(multipleEnv.env_switcher).should("be.visible");
      // Make sure the environment switcher is enabled
      agHelper.AssertAttribute(
        multipleEnv.env_switcher,
        "aria-disabled",
        "false",
      );
      // Check if both environments are present in the dropdown
      agHelper.GetNClick(multipleEnv.env_switcher);
      agHelper.AssertSelectedTab(
        multipleEnv.env_switcher_dropdown_opt_prod,
        "true",
      );
      agHelper.AssertSelectedTab(
        multipleEnv.env_switcher_dropdown_opt_stage,
        "false",
      );
    });

    it("2. Creates a new Postgres ds for both envs and OOS datasource (airtable) only for prod", function () {
      // Create DS with production details
      dataSources.CreateDataSource("Postgres", true, true, prodEnv, true);
      cy.get("@dsName").then(($dsName) => {
        meDatasourceName = $dsName.toString();
      });

      // Add staging env details
      dataSources.EditDatasource();
      multipleEnv.SwitchEnvInDSEditor(stagingEnv);
      // Enter wrong values and test
      dataSources.FillPostgresDSForm(stagingEnv, false, "failTest");
      dataSources.TestDatasource(false);
      // Enter correct values and test
      cy.get(dataSources._username)
        .clear()
        .type(tedTestConfig.dsValues[stagingEnv].postgres_username);
      dataSources.TestDatasource(true);
      // Save env details
      dataSources.SaveDatasource(false, true);

      //TODO: add assertion for review page also

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
      agHelper.AssertElementVisible(dataSources._activeDS);
    });

    it("3. Create and test query responses for both ds on both environmets and add to a table", function () {
      // Create a query on the ME ds
      const query = 'SELECT * FROM public."users" LIMIT 10;';
      dataSources.CreateQueryFromActiveTab(meDatasourceName);
      agHelper.RenameWithInPane(meQueryName, true);
      dataSources.EnterQuery(query);
      // Run and verify the response for the query
      dataSources.RunQueryNVerifyResponseViews(3);

      // Create a query on the OOS ds
      dataSources.CreateQueryFromActiveTab(oosDatasourceName);
      agHelper.RenameWithInPane(oosQueryName, true);
      //List all records
      dataSources.ValidateNSelectDropdown(
        "Commands",
        "Please select an option",
        "List records",
      );

      agHelper.EnterValue(tedTestConfig.dsValues[prodEnv].AirtableBaseForME, {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Base ID ",
      });
      agHelper.EnterValue(tedTestConfig.dsValues[prodEnv].AirtableTableForME, {
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

      //switch back to postgres query
      agHelper.GetNClick(entityExplorer._entityNameInExplorer(meQueryName));
      dataSources.RunQueryNVerifyResponseViews(3);
    });

    it("4. Check table response for both environments", function () {
      // Bind the postgres query to a table
      agHelper.GetNClick(entityExplorer._entityNameInExplorer(meQueryName));
      dataSources.AddSuggesstedWidget(Widgets.Table);
      // Check the records on the table
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      //Navigate to the table widget
      entityExplorer.SelectEntityByName("Table1", "Widgets");
      multipleEnv.SwitchEnv(prodEnv);
      //[Done]TODO: move to common locators
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
    });

    it("5. Deploy the app, check for modal and check table response for both envs", function () {
      deployMode.DeployApp(undefined, true, true, true, true);
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      // Check for env switcher
      agHelper.AssertElementExist(multipleEnv.env_switcher);
      // Check table values
      multipleEnv.SwitchEnv(prodEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      multipleEnv.SwitchEnv(stagingEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      deployMode.NavigateBacktoEditor();
      multipleEnv.SwitchEnv(prodEnv);
      // Clean up
      entityExplorer.SelectEntityByName("Table1", "Widgets");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1",
        action: "Delete",
        entityType: EntityItems.Widget,
      });
      dataSources.DeleteQuery(meQueryName);
      dataSources.DeleteQuery(oosQueryName);
      // Won't be deleting the ds since it is being used by a query in deploy mode
    });

    // TODO: assert data from query in OOS is same for both stage and prod
    // TODO: add CRUD page tests
  },
);
