import {
  agHelper,
  dataSources,
  entityItems,
} from "../../../../support/Objects/ObjectsCore";

describe(
  "Create a query with a empty datasource, run, save the query",
  { tags: ["@tag.Datasource"] },
  function () {
    beforeEach(() => {
      cy.startRoutesForDatasource();
    });

    it("1. Create a empty datasource", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      cy.get(dataSources._databaseName).type("admin1");
      dataSources.SaveDatasource();

      //Create a query for empty/incorrect datasource and validate
      dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
      dataSources.RunQuery({ toValidateResponse: false });
      cy.wait(500);
      cy.get("[data-testid=t--query-error]").contains(
        "[Missing endpoint., Missing username for authentication.]",
      );
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
    });
  },
);
