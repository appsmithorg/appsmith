import {
  agHelper,
  assertHelper,
  dataSources,
} from "../../../../support/Objects/ObjectsCore";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("Datasource structure schema preview data", () => {
  before(() => {
    featureFlagIntercept({ ab_gsheet_schema_enabled: true });
    dataSources.CreateDataSource("Postgres");
  });

  it("1. Table selection should be enabled and add template button absent", () => {
    dataSources.selectTabOnDatasourcePage("View data");
    agHelper.TypeText(dataSources._datasourceStructureSearchInput, "users");
    agHelper.GetNClick(
      dataSources._dsPageTabContainerTableName("public.users"),
    );
    assertHelper.AssertNetworkExecutionSuccess("@schemaPreview");
    agHelper.AssertElementAbsence(
      dataSources._dsPageTableTriggermenuTarget("public.users"),
    );
  });
});
