import { ObjectsRegistry } from "../../../../support/Objects/Registry";
const { ApiPage, DataSources, EntityExplorer } = ObjectsRegistry;

describe("Validate generate CRUD operation by creating a datasource from generate CRUD form", () => {
  it("Generated CRUD app should work when there are no entities in the page", () => {
    DataSources.GeneratePageWithMockDB();
  });
  it("Generated CRUD app should work when there are entities in the current page", () => {
    EntityExplorer.AddNewPage("add-page");
    ApiPage.CreateApi();
    DataSources.GeneratePageWithMockDB();
  });
});
