import * as _ from "../../../../support/Objects/ObjectsCore";
import reconnectDatasource from "../../../../locators/ReconnectLocators.js";

const dsl = require("../../../../fixtures/mongoAppdsl.json");

let workspaceId: string, datasource: any;

describe("Fork application with multiple datasources", function () {
  function setDataSourceVar(
    host: string,
    port: number,
    databaseName: string,
  ): void {
    cy.get(_.dataSources._host).type(host);
    cy.get(_.dataSources._port).type(port.toString());
    cy.get(_.dataSources._databaseName).clear().type(databaseName);
    cy.get(_.dataSources._saveDs).click();
  }

  before(() => {
    _.agHelper.AddDsl(dsl);
    _.dataSources.CreateDataSource("Mongo");
    _.dataSources.CreateQueryAfterDSSaved("", "GetProduct");
    _.dataSources.CreateDataSource("Postgres");
    _.dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
  });

  it("1. Add datasource - Mongo, Postgres, fork and test the forked application", function () {
    const appname: string = localStorage.getItem("AppName") || "randomApp";
    _.homePage.NavigateToHome();
    _.agHelper.GenerateUUID();
    cy.get("@guid").then((uid) => {
      workspaceId = "forkApp" + uid;
      _.homePage.CreateNewWorkspace(workspaceId);
      cy.get("body").type("{esc}");
      cy.log("------------------" + workspaceId);
      _.homePage.ForkApplication(appname, workspaceId);
    });

    setDataSourceVar(
      _.hostPort.mongo_host,
      _.hostPort.mongo_port,
      _.hostPort.mongo_databaseName,
    );
    setDataSourceVar(
      _.hostPort.postgres_host,
      _.hostPort.postgres_port,
      _.hostPort.postgres_databaseName,
    );

    cy.get('[kind="heading-m"]').should(($element) => {
      expect($element).to.contain("Your application is ready to use.");
    });

    _.homePage.AssertNCloseImport();
  });
});
