import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources;

describe(
  "Bug 21734: On Action editor page on the right side pane schema plus button interaction",
  { tags: ["@tag.Datasource"] },
  function () {
    it("1. On clicking schema plus option when the templates menu open, the plus button should still be visible", function () {
      let datasourceName = "";
      dataSources.NavigateToDSCreateNew();
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName as unknown as string;
        dataSources.CreateQueryForDS(datasourceName);
        dataSources.clickTemplateMenuForSchemaTable(0);
      });
    });
  },
);
