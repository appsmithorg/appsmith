import { dataSources, agHelper } from "../../../../support/Objects/ObjectsCore";
describe.skip(
  "Switch datasource",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    let dsName_1, dsName_2, MongoDB;
    beforeEach(() => {
      dataSources.StartDataSourceRoutes();
    });

    it("1. Create postgres datasource", function () {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName_1 = $dsName;
      });
    });
    it("2. Create another postgres datasource", function () {
      dataSources.CreateDataSource("Postgres");
      cy.get("@dsName").then(($dsName) => {
        dsName_2 = $dsName;
      });
    });

    it("3. Create mongo datasource", function () {
      dataSources.CreateDataSource("Mongo");
      cy.get("@dsName").then(($dsName) => {
        MongoDB = $dsName;
      });
    });

    it("4. By switching datasources execute a query with both the datasources", function () {
      dataSources.CreateQueryForDS(dsName_1);
      agHelper.GetNClick(".rc-select-show-arrow");
      cy.contains(".rc-select-item-option-content", dsName_2)
        .click()
        .wait(1000);
      cy.runQuery();
      // Confirm mongo datasource is not present in the switch datasources dropdown
      agHelper.GetNClick(".rc-select-show-arrow");
      cy.get(".rc-select-item-option-content").should("not.have", MongoDB);
    });

    after(() => {
      dataSources.DeleteQuery("Query1");
      cy.deleteDatasource(MongoDB);
      cy.deleteDatasource(dsName_1);
      cy.deleteDatasource(dsName_2);
    });
  },
);
