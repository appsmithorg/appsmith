import {
  agHelper,
  dataSources,
  entityItems,
  homePage,
} from "../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
  AppSidebarButton,
  AppSidebar,
  PageLeftPane,
} from "../../../../support/Pages/EditorNavigation";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

let guid;
let dataSourceName: string;
describe("Datasource form related tests", function () {
  before(() => {
    featureFlagIntercept({
      ab_gsheet_schema_enabled: true,
      ab_mock_mongo_schema_enabled: true,
    });
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
      agHelper.RenameWithInPane(dataSourceName, false);
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

  it("2. Verify if schema was fetched once #18448", () => {
    agHelper.RefreshPage();
    EditorNavigation.SelectEntityByName(dataSourceName, EntityType.Datasource);
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

  it(
    "excludeForAirgap",
    "3. Verify if schema (table and column) exist in query editor and searching works",
    () => {
      agHelper.RefreshPage();
      dataSources.CreateMockDB("Users");
      dataSources.CreateQueryAfterDSSaved();
      dataSources.VerifyTableSchemaOnQueryEditor("public.users");
      PageLeftPane.expandCollapseItem("public.users");
      dataSources.VerifyColumnSchemaOnQueryEditor("id");
      dataSources.FilterAndVerifyDatasourceSchemaBySearch(
        "public.us",
        "public.users",
      );
    },
  );

  it(
    "excludeForAirgap",
    "4. Verify if collapsible opens when refresh button is opened.",
    () => {
      agHelper.RefreshPage();
      dataSources.CreateMockDB("Users");
      dataSources.CreateQueryAfterDSSaved();
      // close the schema
      agHelper.GetNClick(dataSources._queryEditorCollapsibleIcon);
      // then refresh
      dataSources.RefreshDatasourceSchema();
      // assert the schema is open.
      dataSources.VerifySchemaCollapsibleOpenState(true);
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
});
