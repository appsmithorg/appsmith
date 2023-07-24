import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
  deployMode,
  locators,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Check datasource doc links", function () {
  it("1. Verify Postgres documentation opens", function () {
    dataSources.CreateDataSource("Postgres");
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
    dataSources.CreateDataSource("Mongo");
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
    dataSources.CreateDataSource("MySql");
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
});
