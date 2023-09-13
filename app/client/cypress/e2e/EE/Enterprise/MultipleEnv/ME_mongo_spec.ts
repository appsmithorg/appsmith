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
  assertHelper,
  table,
  draggableWidgets,
  entityItems,
} from "../../../../support/ee/ObjectsCore_EE";

let meDatasourceName: string,
  meDSStagingOnlyName: string,
  meQueryName: string,
  prodEnv: string,
  stagingEnv: string,
  meStagingOnlyQueryName: string;
describe(
  "excludeForAirgap",
  "Multiple environment datasource creation and test flow",
  function () {
    before(() => {
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      prodEnv = dataManager.defaultEnviorment;
      stagingEnv = dataManager.environments[1];
      multipleEnv.SwitchEnv(prodEnv);
      meQueryName = "mongo_select";
      meStagingOnlyQueryName = "mongo_stageonly_select";
    });

    it("1. Creates a new Mongo ds for both envs", function () {
      // Create DS with production details
      dataSources.CreateDataSource("Mongo", true, true, prodEnv, true);
      cy.get("@dsName").then(($dsName) => {
        meDatasourceName = $dsName.toString();
      });

      // Add staging env details
      dataSources.EditDatasource();
      multipleEnv.SwitchEnvInDSEditor(stagingEnv);
      // Enter wrong values and test
      dataSources.FillMongoDSForm(stagingEnv);
      dataSources.TestDatasource(true);
      // Save env details
      dataSources.SaveDatasource(false, true);
      dataSources.CreateDataSource(
        "Mongo",
        true,
        true,
        stagingEnv,
        true,
        multipleEnv.SwitchEnvInDSEditor,
      );
      cy.get("@dsName").then(($dsName) => {
        meDSStagingOnlyName = $dsName.toString();
      });
    });

    it("2. Create and test query responses for both ds on both environments and bind to a table", function () {
      // Create a query on the ME DS
      dataSources.CreateQueryFromActiveTab(meDatasourceName);
      agHelper.RenameWithInPane(meQueryName, true);

      dataSources.ValidateNSelectDropdown("Collection", "", "mongomart");
      agHelper.EnterValue("100", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Limit",
      });
      // Run and verify the response for the query
      dataSources.RunQueryNVerifyResponseViews(23, false);
      // Bind the mongo query to a table
      agHelper.GetNClick(entityExplorer._entityNameInExplorer(meQueryName));
      // Check both query responses on staging
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.Sleep();
      dataSources.RunQueryNVerifyResponseViews(17, false);
      dataSources.AddSuggestedWidget(Widgets.Table);
      // Create query on staging only DS
      agHelper.Sleep(2000);
      entityExplorer.AddNewPage("New blank page");
      dataSources.NavigateToActiveTab();
      dataSources.CreateQueryFromActiveTab(meDSStagingOnlyName);
      agHelper.RenameWithInPane(meStagingOnlyQueryName, true);
      dataSources.ValidateNSelectDropdown("Collection", "", "mongomart");
      agHelper.EnterValue("100", {
        propFieldName: "",
        directInput: false,
        inputFieldName: "Limit",
      });
      // Run and verify the response for the query
      dataSources.RunQueryNVerifyResponseViews(17, false);
      multipleEnv.SwitchEnv(prodEnv);
      // verify query fails on prod
      dataSources.RunQuery({ expectedStatus: false });
      cy.get("@postExecute").then((interception: any) => {
        expect(interception.response.body.data.title).to.eq(
          "Datasource not configured for the given environment",
        );
        expect(interception.response.body.data.body).contains(
          "does not have a valid production configuration",
        );
      });
      // Bind the mongo query to a table
      multipleEnv.SwitchEnv(stagingEnv);
      dataSources.RunQueryNVerifyResponseViews(17, false);
      agHelper.GetNClick(
        entityExplorer._entityNameInExplorer(meStagingOnlyQueryName),
      );
      dataSources.AddSuggestedWidget(Widgets.Table);
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.Sleep();
    });

    it("3. Check table response for both environments", function () {
      // Check the records on the table with only staging configured
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "17 Records",
      );
      multipleEnv.SwitchEnv(prodEnv);
      agHelper.ValidateToastMessage(
        'The action "mongo_stageonly_select" has failed.',
      );
      agHelper.GetNAssertContains(locators._tableRecordsContainer, "0 Records");
      entityExplorer.SelectEntityByName("Page1", "Pages");
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "23 Records",
      );
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "17 Records",
      );
    });

    it("4. Generate CRUD page for both datasources", function () {
      dataSources.NavigateFromActiveDS(meDatasourceName, false);
      agHelper.GetNClick(dataSources._selectTableDropdown, 0, true);
      agHelper.GetNClickByContains(dataSources._dropdownOption, "mongomart");
      // generate crud on staging env
      agHelper.ClickButton("Generate page");
      assertHelper.AssertNetworkStatus("@replaceLayoutWithCRUDPage", 201);
      agHelper.AssertContains("Successfully generated a page"); // Commenting this since FindQuery failure appears sometimes
      assertHelper.AssertNetworkStatus("@getActions", 200);
      assertHelper.AssertNetworkStatus("@postExecute", 200);
      agHelper.ClickButton("Got it");
      assertHelper.AssertNetworkStatus("@updateLayout", 200);
      agHelper.Sleep(2000);
      // verify genertae crud option is not present on prod
      multipleEnv.SwitchEnv(prodEnv);
      dataSources.NavigateToActiveTab();
      dataSources.AssertReconnectDS(meDSStagingOnlyName);
    });

    it("5. Deploy the app, check for modal and check table response for both envs", function () {
      // Need to remove the previous user preference for the callout
      window.localStorage.removeItem("userPreferenceDismissEnvCallout");
      agHelper.Sleep();
      deployMode.DeployApp(
        locators._widgetInDeployed(draggableWidgets.TABLE_V1),
        true,
        true,
        true,
        "present",
      );
      featureFlagIntercept({ release_datasource_environments_enabled: true });
      // Check for env switcher
      agHelper.AssertElementExist(multipleEnv.env_switcher);
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.SelectTableRow(1);
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.not.be.empty;
      });
      table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("45");
      });
      table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Track Jacket");
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
      dataSources.AssertJSONFormHeader(1, 4, "Id", "4", true);

      multipleEnv.SwitchEnv(stagingEnv); //Assert data is changed for Staging env
      //Validating loaded table
      agHelper.AssertElementExist(dataSources._selectedRow);
      table.SelectTableRow(1);
      table.ReadTableRowColumnData(1, 0, "v1", 2000).then(($cellData) => {
        expect($cellData).to.be.empty;
      });
      table.ReadTableRowColumnData(1, 2, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("45");
      });
      table.ReadTableRowColumnData(1, 6, "v1", 200).then(($cellData) => {
        expect($cellData).to.eq("Women's T-shirt");
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
      dataSources.AssertJSONFormHeader(1, 4, "Id", "5", true);

      // Check table values
      multipleEnv.SwitchEnv(prodEnv);

      agHelper.GetNClickByContains(locators._deployedPage, "Page1");
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "23 Records",
      );
      agHelper.GetNClickByContains(locators._deployedPage, "Page2");
      agHelper.ValidateToastMessage(
        'The action "mongo_stageonly_select" has failed.',
      );
      agHelper.GetNAssertContains(locators._tableRecordsContainer, "0 Records");
      multipleEnv.SwitchEnv(stagingEnv);
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "17 Records",
      );
      agHelper.GetNClickByContains(locators._deployedPage, "Page1");
      agHelper.GetNAssertContains(
        locators._tableRecordsContainer,
        "17 Records",
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
      // Won't be deleting the ds since it is being used by a query in deploy mode
    });
  },
);
