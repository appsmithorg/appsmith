import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { Widgets } from "../../../../support/Pages/DataSources";
import {
  multipleEnv,
  agHelper,
  dataSources,
  deployMode,
  entityExplorer,
  locators,
  dataManager,
  table,
  assertHelper,
  draggableWidgets,
  entityItems,
} from "../../../../support/ee/ObjectsCore_EE";

let meDatasourceName: string,
  meQueryName: string,
  meStagingOnlyQueryName: string,
  prodEnv: string,
  stagingEnv: string,
  meDSStagingOnlyName: string;

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
      meQueryName = "postgres_select";
      meStagingOnlyQueryName = "postgres_stageonly_select";
    });

    it("1. Creates a new Postgres ds for both envs and one for only staging", function () {
      // Create DS with production details
      dataSources.CreateDataSource("Postgres", true, true, prodEnv, true);
      cy.get("@dsName").then(($dsName) => {
        meDatasourceName = $dsName.toString();
      });

      multipleEnv.VerifyEnvDetailsInReviewMode("PostgreSQL", prodEnv);

      // Add staging env details
      dataSources.EditDatasource();
      multipleEnv.SwitchEnvInDSEditor(stagingEnv);
      // Enter wrong values and test
      dataSources.FillPostgresDSForm(stagingEnv, false, "failTest");
      dataSources.TestDatasource(false);
      // Enter correct values and test
      cy.get(dataSources._username)
        .clear()
        .type(dataManager.dsValues[stagingEnv].postgres_username);
      dataSources.TestDatasource(true);
      // Save env details
      dataSources.SaveDatasource(false, true);
      multipleEnv.VerifyEnvDetailsInReviewMode("PostgreSQL", stagingEnv);

      // Create DS with Staging only details
      dataSources.CreateDataSource(
        "Postgres",
        true,
        true,
        stagingEnv,
        true,
        multipleEnv.SwitchEnvInDSEditor,
      );
      cy.get("@dsName").then(($dsName) => {
        meDSStagingOnlyName = $dsName.toString();
      });
      multipleEnv.VerifyEnvDetailsInReviewMode("PostgreSQL", stagingEnv);
    });

    it("2. Create and test query responses for both ds on both environmets and add Suggested table", function () {
      // Create a query on the ME ds
      const query = 'SELECT * FROM public."city"';
      dataSources.CreateQueryFromActiveTab(meDatasourceName);
      agHelper.RenameWithInPane(meQueryName, true);
      dataSources.EnterQuery(query);
      // Run and verify the response for the query
      dataSources.RunQueryNVerifyResponseViews(600);

      dataSources.AddSuggestedWidget(Widgets.Table);
      // Create query on staging only DS
      agHelper.Sleep(2000);
      entityExplorer.AddNewPage("New blank page");
      multipleEnv.SwitchEnv(stagingEnv);
      dataSources.NavigateToActiveTab();
      dataSources.CreateQueryForDS(
        meDSStagingOnlyName,
        query,
        meStagingOnlyQueryName,
      );
      // Run and verify the response for the query
      dataSources.RunQueryNVerifyResponseViews(43);
      multipleEnv.SwitchEnv(prodEnv);
      // verify query fails on prod for staging only configured DS
      dataSources.RunQuery({ expectedStatus: false });
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.title).to.eq(
          "Datasource not configured for the given environment",
        );
        expect(interception.response.body.data.body).contains(
          "does not have a valid production configuration",
        );
      });
      // Bind the postgres query to a table
      multipleEnv.SwitchEnv(stagingEnv);
      dataSources.RunQueryNVerifyResponseViews(43);
      agHelper.GetNClick(
        entityExplorer._entityNameInExplorer(meStagingOnlyQueryName),
      );
      dataSources.AddSuggestedWidget(Widgets.Table);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.Sleep();
    });

    it("3. Check table response for both environments", function () {
      // Check the records on the table
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "43 Records",
      );
      multipleEnv.SwitchEnv(prodEnv);
      agHelper.ValidateToastMessage(
        'The action "postgres_stageonly_select" has failed.',
      );
      agHelper.GetNAssertContains(locators._tableRecordsContainer, "0 Records");
      entityExplorer.SelectEntityByName("Page1", "Pages");
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "600 Records",
      );
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "43 Records",
      );
    });

    it("4. Generate CRUD page for both datasources", function () {
      dataSources.NavigateFromActiveDS(meDatasourceName, false);
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "city");
      agHelper.ClickButton("Generate page");
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.ValidateToastMessage("Successfully generated a page");
      //assertHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.Sleep(2000);
      table.WaitUntilTableLoad();
      // verify generate crud option is not present on prod
      multipleEnv.SwitchEnv(prodEnv);
      dataSources.NavigateToActiveTab();
      dataSources.AssertReconnectDS(meDSStagingOnlyName);
    });

    it("5 Deploy the app, check for modal and check table response for both envs", function () {
      // Need to remove the previous user preference for the callout
      window.localStorage.removeItem("userPreferenceDismissEnvCallout");
      agHelper.Sleep(2000);
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.TABLE_V1),
        true,
        true,
        true,
        "present",
      );
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      agHelper.GetNClickByContains(locators._deployedPage, "Public.city");
      agHelper.AssertElementExist(dataSources._selectedRow);

      table.ReadTableRowColumnData(0, 1, "v1", 4000).then(($cellData) => {
        expect($cellData).to.eq("A Corua (La Corua)");
      });
      table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("87");
      });

      //Validating loaded JSON form
      cy.xpath(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, 0, "city_id", "1");
      multipleEnv.SwitchEnv(prodEnv);
      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 1, "v1", 4000).then(($cellData) => {
        expect($cellData).to.eq("A Corua (La Corua)");
      });
      table.ReadTableRowColumnData(0, 2, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("87");
      });

      //Validating loaded JSON form
      cy.xpath(locators._buttonByText("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, 0, "city_id", "1");
      agHelper.AssertElementExist(multipleEnv.env_switcher);
      // Check table values for binded tables
      multipleEnv.SwitchEnv(prodEnv);
      agHelper.GetNClickByContains(locators._deployedPage, "Page1");
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "600 Records",
      );
      agHelper.GetNClickByContains(locators._deployedPage, "Page2");
      agHelper.GetNAssertContains(locators._tableRecordsContainer, "0 Records");
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "43 Records",
      );
      agHelper.GetNClickByContains(locators._deployedPage, "Page1");
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "43 Records",
      );
      deployMode.NavigateBacktoEditor();
      multipleEnv.SwitchEnv(prodEnv);
      // Clean up
      entityExplorer.SelectEntityByName("Table1", "Widgets");
      entityExplorer.ActionContextMenuByEntityName({
        entityNameinLeftSidebar: "Table1",
        action: "Delete",
        entityType: entityItems.Widget,
      });
      dataSources.DeleteQuery(meQueryName);
      entityExplorer.SelectEntityByName("Page2", "Pages");
      dataSources.DeleteQuery(meStagingOnlyQueryName);
      // Won't be deleting the ds since it is being used by a query in deploy mode
    });
  },
);
