import { ObjectsRegistry } from "../../../../support/Objects/Registry";
import {
  AppSidebar,
  AppSidebarButton,
} from "../../../../support/Pages/EditorNavigation";

const dataSources = ObjectsRegistry.DataSources,
  agHelper = ObjectsRegistry.AggregateHelper;

describe(
  "Bug 18035: Updates save button text on datasource discard popup",
  {
    tags: [
      "@tag.Datasource",
      "@tag.excludeForAirgap",
      "@tag.Git",
      "@tag.AccessControl",
    ],
  },
  function () {
    it("1. Create gsheet datasource, click on back button, discard popup should contain save and authorize", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("Google Sheets");
      AppSidebar.navigate(AppSidebarButton.Editor, true);
      agHelper.AssertContains(
        "Save & Authorize",
        "exist",
        dataSources._datasourceModalSave,
      );
      cy.get(dataSources._datasourceModalDoNotSave).click();
      //Create any other datasource, click on back button, discard popup should contain save
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("PostgreSQL");
      // Need to add values since without that, going back won't show any popup
      dataSources.FillPostgresDSForm();
      AppSidebar.navigate(AppSidebarButton.Editor, true);
      agHelper.AssertContains(
        "Save",
        "exist",
        dataSources._datasourceModalSave,
      );
      cy.get(dataSources._datasourceModalDoNotSave).click();
    });

    it("2. Bug 19426: Testing empty datasource without saving should not throw 404", function () {
      dataSources.NavigateToDSCreateNew();
      dataSources.CreatePlugIn("S3");
      dataSources.TestDatasource(false);
      dataSources.FillS3DSForm();
      dataSources.SaveDSFromDialog(false);
    });
  },
);
