import * as _ from "../../../../support/Objects/ObjectsCore";

let dsName: any;

describe("Check datasource doc links", function () {
  it("1. Verify Postgres documentation opens", function () {
    _.dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.CreateQueryAfterDSSaved();
      _.agHelper.AssertNewTabOpened(() => {
        _.agHelper.GetNClick(_.dataSources._queryDoc);
      });
    });
  });

  it("2. Verify Mongo documentation opens", function () {
    _.dataSources.CreateDataSource("Mongo");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.CreateQueryAfterDSSaved();
      _.agHelper.AssertNewTabOpened(() => {
        _.agHelper.GetNClick(_.dataSources._queryDoc);
      });
    });
  });

  it("3. Verify MySQL documentation opens", function () {
    _.dataSources.CreateDataSource("MySql");
    cy.get("@dsName").then(($dsName) => {
      dsName = $dsName;
      _.dataSources.CreateQueryAfterDSSaved();
      _.agHelper.AssertNewTabOpened(() => {
        _.agHelper.GetNClick(_.dataSources._queryDoc);
      });
    });
  });

  afterEach(() => {
    _.agHelper.PressEscape();
    _.agHelper.ActionContextMenuWithInPane("Delete");
    _.entityExplorer.ExpandCollapseEntity("Datasources");
    _.entityExplorer.ActionContextMenuByEntityName(
      dsName,
      "Delete",
      "Are you sure?",
    );
    _.agHelper.AssertContains("deleted successfully");
  });
});
