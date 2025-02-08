import {
  agHelper,
  dataSources,
  entityItems,
  homePage,
  locators,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
} from "../../../../support/Pages/EditorNavigation";

let guid;
let dataSourceName: string;
describe(
  "Datasource form related tests",
  { tags: ["@tag.Datasource", "@tag.Git", "@tag.AccessControl"] },
  function () {
    before(() => {
      homePage.CreateNewWorkspace("FetchSchemaOnce", true);
      homePage.CreateAppInWorkspace("FetchSchemaOnce");
    });

    it("1. Bug - 17238 Verify datasource structure refresh on save - invalid datasource", () => {
      agHelper.GenerateUUID();
      cy.get("@guid").then((uid) => {
        guid = uid;
        dataSourceName = "Postgres " + guid;
        dataSources.NavigateToDSCreateNew();
        dataSources.CreatePlugIn("PostgreSQL");
        agHelper.RenameDatasource(dataSourceName);
        dataSources.FillPostgresDSForm(
          "Production",
          false,
          "docker",
          "wrongPassword",
        );
        dataSources.VerifySchema(
          dataSourceName,
          "An exception occurred while creating connection pool.",
        );
        agHelper.GetNClick(dataSources._editButton);
        dataSources.UpdatePassword("docker");
        dataSources.VerifySchema(dataSourceName, "public.", true);
        dataSources.CreateQueryAfterDSSaved(dataSourceName);
      });
    });

    //This test is failing because of this bug #36348
    it.skip("2. Verify if schema was fetched once #36348", () => {
      agHelper.RefreshPage();
      EditorNavigation.SelectEntityByName(
        dataSourceName,
        EntityType.Datasource,
      );
      agHelper.Sleep(1500);
      agHelper.VerifyCallCount(`@getDatasourceStructure`, 1);
      AppSidebar.navigate(AppSidebarButton.Editor);
      EditorNavigation.SelectEntityByName("Query1", EntityType.Query);
      agHelper.ActionContextMenuWithInPane({
        action: "Delete",
        entityType: entityItems.Query,
      });
      dataSources.DeleteDatasourceFromWithinDS(dataSourceName);
    });

    it.skip(
      "3. Verify if schema (table and column) exist in query editor and searching works",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        agHelper.RefreshPage();
        dataSources.CreateMockDB("Users");
        dataSources.CreateQueryAfterDSSaved();
        agHelper.GetNClick(dataSources._dsTabSchema);
        agHelper.AssertElementAbsence(locators._btnSpinner);
        dataSources.FilterAndVerifyDatasourceSchemaBySearch(
          "public.us",
          "public.users",
        );
        dataSources.SelectTableFromPreviewSchemaList("public.users");
        dataSources.VerifyColumnSchemaOnQueryEditor("id", 0);
      },
    );

    it.skip(
      "4. Verify if refresh works.",
      { tags: ["@tag.excludeForAirgap"] },
      () => {
        agHelper.RefreshPage();
        dataSources.CreateMockDB("Users");
        dataSources.CreateQueryAfterDSSaved();
        agHelper.GetNClick(dataSources._dsTabSchema);
        dataSources.FilterAndVerifyDatasourceSchemaBySearch("public.users");
        dataSources.VerifyTableSchemaOnQueryEditor("public.users");
        // then refresh
        dataSources.RefreshDatasourceSchema();
        // assert the schema is still shown.
        dataSources.FilterAndVerifyDatasourceSchemaBySearch("public.users");
        dataSources.VerifyTableSchemaOnQueryEditor("public.users");
      },
    );

    // the full list for schema-less plugins can be found here. https://www.notion.so/appsmith/Don-t-show-schema-section-for-plugins-that-don-t-support-it-78f82b6abf7948c5a7d596ae583ed8a4?pvs=4#3862343ca2564f7e83a2c8279965ca61
    it("5. Verify schema does not show up in schema-less plugins", () => {
      agHelper.RefreshPage();
      dataSources.CreateDataSource("Redis", true, false);
      dataSources.CreateQueryAfterDSSaved();
      dataSources.VerifySchemaAbsenceInQueryEditor();
    });

    it("6. Verify schema searching works for datasources with empty columns for example S3.", () => {
      agHelper.RefreshPage();
      dataSources.CreateDataSource("S3", true, false);
      dataSources.CreateQueryAfterDSSaved();
      dataSources.FilterAndVerifyDatasourceSchemaBySearch("appsmith-hris");
    });
  },
);
