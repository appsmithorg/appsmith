import * as _ from "../../../../support/Objects/ObjectsCore";

let datasourceName;

describe("Create a query with a empty datasource, run, save the query", function () {
  beforeEach(() => {
    cy.startRoutesForDatasource();
  });

  it("1. Create a empty datasource", function () {
    _.dataSources.NavigateToDSCreateNew();
    _.dataSources.CreatePlugIn("PostgreSQL");
    _.dataSources.SaveDatasource();

    //Create a query for empty/incorrect datasource and validate
    _.dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
    _.dataSources.RunQuery({ toValidateResponse: false });
    cy.get("[data-testid=t--query-error]").contains(
      "[Missing endpoint., Missing username for authentication.]",
    );
    _.agHelper.ActionContextMenuWithInPane("Delete");
  });
});
