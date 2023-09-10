import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
  deployMode,
} from "../../../../support/Objects/ObjectsCore";
import { DataSourceKVP } from "../../../../support/Pages/DataSources";

let dsName: any;

describe("Check datasource doc links", function () {
  it("1. Verify Postgres documentation opens", function () {
    CreateDummyDSNSave(DataSourceKVP["Postgres"]);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "querying-postgres#create-crud-queries",
        "getWorkspace",
      );
    });
  });

  it("2. Verify Mongo documentation opens", function () {
    CreateDummyDSNSave(DataSourceKVP["Mongo"]);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "querying-mongodb#create-queries",
        "getWorkspace",
      );
    });
  });

  it("3. Verify MySQL documentation opens", function () {
    CreateDummyDSNSave(DataSourceKVP["MySql"]);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "querying-mysql#create-queries",
        "getWorkspace",
      );
    });
  });

  it("4. Verify Arango documentation opens", function () {
    CreateDummyDSNSave(DataSourceKVP["ArangoDB"]);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "querying-arango-db#using-queries-in-applications",
        "getWorkspace",
      );
    });
  });

  it("5. Verify S3 documentation opens", function () {
    dataSources.CreateDataSource("S3");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "querying-amazon-s3#list-files",
        "getWorkspace",
      );
    });
  });

  it("6. Verify SMTP documentation opens", function () {
    CreateDummyDSNSave(DataSourceKVP["SMTP"]);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "connect-data/reference/using-smtp",
        "getWorkspace",
      );
    });
  });

  it("7. Verify Airtable documentation opens", function () {
    CreateDummyDSNSave(DataSourceKVP["Airtable"]);
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      deployMode.StubWindowNAssert(
        dataSources._queryDoc,
        "airtable#create-queries",
        "getWorkspace",
      );
    });
  });

  afterEach(() => {
    agHelper.PressEscape();
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    entityExplorer.ExpandCollapseEntity("Datasources");
    dataSources.DeleteDatasouceFromActiveTab(dsName);
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
      agHelper.RenameWithInPane(pluginName + " " + uid, false);
      dataSources.SaveDatasource();
      cy.wrap(pluginName + " " + uid).as("dsName");
    });
  }
});
