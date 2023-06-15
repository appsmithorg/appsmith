import {
  agHelper,
  entityExplorer,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Check datasource doc links", function () {
  it("1. Verify Postgres documentation opens", function () {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      agHelper.AssertNewTabOpened(() => {
        agHelper.GetNClick(dataSources._queryDoc);
      });
    });
  });

  it("2. Verify Mongo documentation opens", function () {
    dataSources.CreateDataSource("Mongo");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      agHelper.AssertNewTabOpened(() => {
        agHelper.GetNClick(dataSources._queryDoc);
      });
    });
  });

  it("3. Verify MySQL documentation opens", function () {
    dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      dataSources.CreateQueryAfterDSSaved();
      agHelper.AssertNewTabOpened(() => {
        agHelper.GetNClick(dataSources._queryDoc);
      });
    });
  });

  afterEach(() => {
    agHelper.PressEscape();
    agHelper.ActionContextMenuWithInPane({
      action: "Delete",
      entityType: entityItems.Query,
    });
    entityExplorer.ExpandCollapseEntity("Datasources");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: dsName,
      action: "Delete",
      entityType: entityItems.Datasource,
      toastToValidate: "deleted successfully",
    });
  });
});
