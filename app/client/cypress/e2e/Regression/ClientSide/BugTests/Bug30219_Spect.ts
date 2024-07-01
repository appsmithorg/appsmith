import { ObjectsRegistry } from "../../../../support/Objects/Registry";

const dataSources = ObjectsRegistry.DataSources;

describe(
  "Bug 30219: On Action editor page on the right side pane schema plus button interaction",
  { tags: ["@tag.Datasource"] },
  function () {
    it("1. On clicking schema plus option when the templates menu open, the plus button should still be visible. Earlier it was hidden when the templates menu was opened.", function () {
      let datasourceName = "";
      dataSources.NavigateToDSCreateNew();
      // CreateDataSource function requires type of datasources to be created
      dataSources.CreateDataSource("MySql");
      cy.get("@dsName").then(($dsName) => {
        datasourceName = $dsName as unknown as string;
        dataSources.CreateQueryForDS(datasourceName);
        // This function asserts the visibility of plus icon before and after the templates menu is opened after clicking on it.
        dataSources.ClickTemplateMenuForSchemaTable(0);
      });
    });
  },
);
