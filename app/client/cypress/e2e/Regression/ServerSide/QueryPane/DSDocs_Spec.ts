import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
  deployMode,
  dataManager,
} from "../../../../support/Objects/ObjectsCore";
import { DataSourceKVP } from "../../../../support/Pages/DataSources";
import { PluginActionForm } from "../../../../support/Pages/PluginActionForm";

let dsName: any;
let pluginActionForm = new PluginActionForm();

describe(
  "Check datasource doc links",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Verify Postgres documentation opens", function () {
      CreateDummyDSNSave(DataSourceKVP["Postgres"]);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-postgres#create-crud-queries",
          "getPluginForm",
        );
      });
    });

    it("2. Verify Mongo documentation opens", function () {
      CreateDummyDSNSave(DataSourceKVP["Mongo"]);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-mongodb#create-queries",
          "getPluginForm",
        );
      });
    });

    it("3. Verify MySQL documentation opens", function () {
      CreateDummyDSNSave(DataSourceKVP["MySql"]);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-mysql#create-queries",
          "getPluginForm",
        );
      });
    });

    it("4. Verify Arango documentation opens", function () {
      CreateDummyDSNSave(DataSourceKVP["ArangoDB"]);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-arango-db#using-queries-in-applications",
          "getPluginForm",
        );
      });
    });

    it("5. Verify S3 documentation opens", function () {
      dataSources.CreateDataSource("S3");
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-amazon-s3#list-files",
          "getPluginForm",
        );
      });
    });

    it("6. Verify SMTP documentation opens", function () {
      CreateDummyDSNSave(DataSourceKVP["SMTP"]);
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "connect-data/reference/using-smtp",
          "getPluginForm",
        );
      });
    });

    it(
      "7. Verify Airtable documentation opens",
      { tags: ["@tag.excludeForAirgap"] },
      function () {
        CreateDummyDSNSave(DataSourceKVP["Airtable"]);
        cy.get("@dsName").then(($dsName) => {
          dsName = $dsName;
          dataSources.CreateQueryAfterDSSaved();
          pluginActionForm.toolbar.openContextMenu();
          deployMode.StubWindowNAssert(
            dataSources._queryDoc,
            "airtable#create-queries",
            "getPluginForm",
          );
        });
      },
    );

    it("8. Verify Oracle documentation opens", function () {
      dataSources.CreateDataSource(
        "Oracle",
        true,
        false,
        dataManager.environments[1],
      ); //using mock dataset for oracle
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-oracle#create-queries",
          "getPluginForm",
        );
      });
    });

    it("9. Verify Firestore documentation opens", function () {
      dataSources.CreateDataSource(
        "Firestore",
        true,
        false,
        dataManager.environments[1],
      ); //using mock dataset for oracle
      cy.get("@dsName").then(($dsName) => {
        dsName = $dsName;
        dataSources.CreateQueryAfterDSSaved();
        pluginActionForm.toolbar.openContextMenu();
        deployMode.StubWindowNAssert(
          dataSources._queryDoc,
          "querying-firestore#understanding-commands",
          "getPluginForm",
        );
      });
    });

    afterEach(() => {
      agHelper.PressEscape();
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(dsName);
      // entityExplorer.ActionContextMenuByEntityName({
      //   entityNameinLeftSidebar: dsName,
      //   action: "Delete",
      //   entityType: entityItems.Datasource,
      //   toastToValidate: "deleted successfully",
      // });//Since after query delete, DS is not appearing in EntityExplorer, this has potential to fail
    });

    function CreateDummyDSNSave(pluginName: string) {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        dataSources.NavigateToDSCreateNew();
        dataSources.CreatePlugIn(pluginName);
        agHelper.RenameDatasource(pluginName + " " + uid);
        dataSources.SaveDatasource();
        cy.wrap(pluginName + " " + uid).as("dsName");
      });
    }
  },
);
