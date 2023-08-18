import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  dataSources,
  deployMode,
  entityExplorer,
  locators,
  dataManager,
  table,
  assertHelper,
  draggableWidgets,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import { EntityItems } from "../../../../support/Pages/AssertHelper";
import { multipleEnv } from "../../../../support/ee/ObjectsCore_EE";

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

    it("2. Create and test query responses for both ds on both environmets and add to a table", function () {
      // Create a query on the ME ds
      const query = 'SELECT * FROM public."users" LIMIT 10;';
      dataSources.CreateQueryFromActiveTab(meDatasourceName);
      agHelper.RenameWithInPane(meQueryName, true);
      dataSources.EnterQuery(query);
      // Run and verify the response for the query
      dataSources.RunQueryNVerifyResponseViews(3);

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
      dataSources.RunQuery();
      multipleEnv.SwitchEnv(prodEnv);
      // verify query fails on prod
      dataSources.RunQuery({ expectedStatus: false });
      // Bind the postgres query to a table
      multipleEnv.SwitchEnv(stagingEnv);
      dataSources.RunQuery();
      agHelper.GetNClick(
        entityExplorer._entityNameInExplorer(meStagingOnlyQueryName),
      );
      dataSources.AddSuggestedWidget(Widgets.Table);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.Sleep();
    });

    it("3. Check table response for both environments", function () {
      // Check the records on the table
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      multipleEnv.SwitchEnv(prodEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "0 Records");
      entityExplorer.SelectEntityByName("Page1", "Pages");
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      multipleEnv.SwitchEnv(stagingEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
    });

    it("4. Generate CRUD page for both datasources", function () {
      dataSources.NavigateFromActiveDS(meDatasourceName, false);
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "orders");
      agHelper.GetNClick(dataSources._generatePageBtn);
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page");
      //assertHelper.AssertNetworkStatus("@getActions", 200);//Since failing sometimes
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.GetNClick(dataSources._visibleTextSpan("Got it"));
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.Sleep(2000);
      table.WaitUntilTableLoad();
      // verify genertae crud option is  not present on prod
      multipleEnv.SwitchEnv(prodEnv);
      dataSources.AssertDSActive(meDSStagingOnlyName);
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
      agHelper.GetNClickByContains(locators._deployedPage, "Public.orders");
      agHelper.AssertElementExist(dataSources._selectedRow);

      table.ReadTableRowColumnData(0, 1, "v1", 4000).then(($cellData) => {
        expect($cellData).to.eq("VINET");
      });
      table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("1996-07-04");
      });
      table.ReadTableRowColumnData(0, 4, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("1996-08-01");
      });

      //Validating loaded JSON form
      cy.xpath(locators._spanButton("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, 0, "order_id");
      multipleEnv.SwitchEnv(prodEnv);
      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.ReadTableRowColumnData(0, 1, "v1", 4000).then(($cellData) => {
        expect($cellData).to.eq("VINET");
      });
      table.ReadTableRowColumnData(0, 3, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("1996-07-04");
      });
      table.ReadTableRowColumnData(0, 4, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("1996-08-01");
      });

      //Validating loaded JSON form
      cy.xpath(locators._spanButton("Update")).then((selector) => {
        cy.wrap(selector)
          .invoke("attr", "class")
          .then((classes) => {
            //cy.log("classes are:" + classes);
            expect(classes).not.contain("bp3-disabled");
          });
      });
      dataSources.AssertJSONFormHeader(0, 0, "order_id");
      agHelper.AssertElementExist(multipleEnv.env_switcher);
      // Check table values for binded tables
      multipleEnv.SwitchEnv(prodEnv);
      agHelper.GetNClickByContains(locators._deployedPage, "Page1");
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      agHelper.GetNClickByContains(locators._deployedPage, "Page2");
      cy.get(locators._tableRecordsContainer).should("contain", "0 Records");
      multipleEnv.SwitchEnv(stagingEnv);
      cy.get(locators._tableRecordsContainer).should("contain", "3 Records");
      agHelper.GetNClickByContains(locators._deployedPage, "Page1");
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
      entityExplorer.SelectEntityByName("Page2", "Pages");
      dataSources.DeleteQuery(meStagingOnlyQueryName);
      // Won't be deleting the ds since it is being used by a query in deploy mode
    });
  },
);
