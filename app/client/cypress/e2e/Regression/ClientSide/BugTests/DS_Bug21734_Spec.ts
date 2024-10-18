import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";
import PageList from "../../../../support/Pages/PageList";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "Bug 21734: On exiting from the Datasources page without saving changes, an error is thrown and the app becomes unresponsive.",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    it("1. Navigating from intermediary datasource to new page", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Mongo");
      // Have to fill form since modal won't show for empty ds
      dataSources.FillMongoDSForm();

      agHelper.GetNClick(dataSources._addNewDataSource, 0, true);

      agHelper.AssertContains(
        "Don't save",
        "exist",
        dataSources._datasourceModalDoNotSave,
      );
      cy.get(dataSources._datasourceModalDoNotSave).click({ force: true });

      PageList.AddNewPage();

      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.AssertURL("page1");

      EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
      agHelper.AssertURL("page2");
    });
    it("2. Navigating from intermediary datasource to an existing page", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      // Have to fill form since modal won't show for empty ds
      dataSources.FillPostgresDSForm();

      AppSidebar.navigate(AppSidebarButton.Editor, true);
      agHelper.AssertContains(
        "Don't save",
        "exist",
        dataSources._datasourceModalDoNotSave,
      );
      cy.get(dataSources._datasourceModalDoNotSave).click();
      EditorNavigation.SelectEntityByName("Page1", EntityType.Page);
      agHelper.AssertURL("page1");

      EditorNavigation.SelectEntityByName("Page2", EntityType.Page);
      agHelper.AssertURL("page2");
    });
  },
);
