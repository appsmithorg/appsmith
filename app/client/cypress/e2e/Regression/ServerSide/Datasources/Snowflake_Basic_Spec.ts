import {
  agHelper,
  apiPage,
  dataSources,
  deployMode,
  draggableWidgets,
  entityItems,
  locators,
  table,
} from "../../../../support/Objects/ObjectsCore";
import datasource from "../../../../../cypress/locators/DatasourcesEditor.json";
import EditorNavigation, {
  EntityType,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import { Widgets } from "../../../../support/Pages/DataSources";
import BottomTabs from "../../../../support/Pages/IDE/BottomTabs";
import { PluginActionForm } from "../../../../support/Pages/PluginActionForm";

let pluginActionForm = new PluginActionForm();

const myDsName = "SnowflakeDS1";

describe(
  "Snowflake Basic Tests",
  {
    tags: [
      "@tag.Datasource",
      "@tag.Git",
      "@tag.AccessControl",
      "@tag.Snowflake",
    ],
  },
  () => {
    it("1. Validate the configuration of database", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Snowflake");
      agHelper.AssertElementVisibility(dataSources._imgSnowflakeLogo, true, 1);
      agHelper.GetNAssertContains(locators._dsName, "Untitled datasource 1");

      // Attempt to rename the datasource with invalid and valid names
      agHelper.GetNClick(locators._dsName);
      agHelper.ClearTextField(locators._dsNameTxt, true);
      agHelper.AssertTooltip("Please enter a valid name");
      agHelper.PressEnter();
      agHelper.ValidateToastMessage("Invalid name");
      agHelper.GetNClick(locators._dsName);
      agHelper.TypeText(locators._dsNameTxt, myDsName);
      agHelper.PressEnter();
      agHelper.AssertElementVisibility(dataSources._datasourceCard, true);
      agHelper.AssertAttribute(
        datasource.datasourceConfigUrl,
        "placeholder",
        "xy12345.ap-south-1.aws",
      );

      // Fill out the Snowflake configuration form and test/save the datasource
      dataSources.FillSnowflakeDSForm();
      dataSources.TestSaveDatasource();
    });

    it("2. Validate creating & running queries for the datasource", () => {
      // Create and run a SELECT query, validating the response views
      dataSources.CreateQueryAfterDSSaved(
        "SELECT * FROM PUBLIC.DB1 LIMIT 10;",
        "SelectQuery",
      );
      dataSources.runQueryAndVerifyResponseViews({
        count: 2,
        operator: "gte",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });

      // Create and run an INSERT query, validating the response
      dataSources.CreateQueryForDS(
        myDsName,
        "INSERT INTO PUBLIC.DB1 (SALARY, ID, NAME, POSITION) VALUES (87000, 3, 'Ada', 'Jr. Developer');",
        "InsertQuery",
      );
      dataSources.runQueryAndVerifyResponseViews({
        count: 1,
        operator: "eq",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });

      // Create and run an UPDATE query, validating the response
      dataSources.CreateQueryForDS(
        myDsName,
        "UPDATE PUBLIC.DB1 SET SALARY = 90000 WHERE ID = 3;",
        "UpdateQuery",
      );
      dataSources.runQueryAndVerifyResponseViews({
        count: 1,
        operator: "eq",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });

      // Create and run a DELETE query, validating the response
      dataSources.CreateQueryForDS(
        myDsName,
        "DELETE FROM PUBLIC.DB1 WHERE ID = 3;",
        "DeleteQuery",
      );
      dataSources.runQueryAndVerifyResponseViews({
        count: 1,
        operator: "eq",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });
    });

    it("3. Validate widget binding with queries & deploying the app", () => {
      PageLeftPane.selectItem("SelectQuery", { ctrlKey: true, force: true });
      dataSources.AddSuggestedWidget(Widgets.Table);
      //deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      //table.AssertTableLoaded(0, 0, "v2");
      //deployMode.NavigateBacktoEditor();
      EditorNavigation.SelectEntityByName("SelectQuery", EntityType.Query);
    });

    it("4. Validate deleting the datasource", () => {
      // Delete all queries associated with the datasource
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      PageLeftPane.selectItem("InsertQuery", { ctrlKey: true, force: true });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      PageLeftPane.selectItem("UpdateQuery", { ctrlKey: true, force: true });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      PageLeftPane.selectItem("DeleteQuery", { ctrlKey: true, force: true });
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });

      // Delete the datasource and verify its removal
      dataSources.DeleteDatasourceFromWithinDS(myDsName, 409);
      deployMode.DeployApp(locators._widgetInDeployed(draggableWidgets.TABLE));
      table.WaitForTableEmpty("v2");
      deployMode.NavigateBacktoEditor();
      dataSources.DeleteDatasourceFromWithinDS(myDsName, 200);
    });

    it("5. Validate the user can create new queries from the datasource section in response tab", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Snowflake");
      dataSources.FillSnowflakeDSForm();
      dataSources.TestSaveDatasource();

      // Create, run, and validate SELECT, INSERT, UPDATE, and DELETE queries using templates
      dataSources.createQueryWithDatasourceSchemaTemplate(
        "Untitled datasource 1",
        "DB1",
        "Select",
      );
      agHelper.RenameQuery("TemplateSelectQuery");
      apiPage.ToggleOnPageLoadRun(true);
      pluginActionForm.toolbar.toggleSettings();
      apiPage.ToggleConfirmBeforeRunning(true);
      agHelper.RefreshPage();
      agHelper.GetNClick(locators._confirmationdialogbtn("Yes"));
      BottomTabs.response.validateRecordCount({ count: 2, operator: "gte" });

      dataSources.createQueryWithDatasourceSchemaTemplate(
        "Untitled datasource 1",
        "DB1",
        "Insert",
      );
      dataSources.EnterQuery(
        "INSERT INTO PUBLIC.DB1 (SALARY, ID, NAME, POSITION) VALUES (87000, 3, 'Ada', 'Jr. Developer');",
      );
      agHelper.RenameQuery("TemplateInsertQuery");
      dataSources.runQueryAndVerifyResponseViews({
        count: 1,
        operator: "eq",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });

      dataSources.createQueryWithDatasourceSchemaTemplate(
        "Untitled datasource 1",
        "DB1",
        "Update",
      );
      dataSources.EnterQuery(
        "UPDATE PUBLIC.DB1 SET SALARY = 90000 WHERE ID = 3;",
      );
      agHelper.RenameQuery("TemplateUpdateQuery");
      dataSources.runQueryAndVerifyResponseViews({
        count: 1,
        operator: "eq",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });

      dataSources.createQueryWithDatasourceSchemaTemplate(
        "Untitled datasource 1",
        "DB1",
        "Delete",
      );
      dataSources.EnterQuery("DELETE FROM PUBLIC.DB1 WHERE ID = 3;");
      agHelper.RenameQuery("TemplateDeleteQuery");
      dataSources.runQueryAndVerifyResponseViews({
        count: 1,
        operator: "eq",
        responseTypes: ["TABLE", "JSON", "RAW"],
      });

      // Visit the documentation link
      agHelper.GetNClick(locators._contextMenuInPane);
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "querying-snowflake-db#querying-snowflake",
        "getDatasourceStructure",
      );
    });

    it("6. Validate connection error when misconfiguring datasource", () => {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Snowflake");
      agHelper.GetNAssertContains(locators._dsName, "Untitled datasource 2");
      agHelper.AssertElementVisibility(dataSources._datasourceCard, true);
      dataSources.FillSnowflakeDSForm(undefined, undefined, "wrongpassword");
      dataSources.TestDatasource(false);
    });
  },
);
