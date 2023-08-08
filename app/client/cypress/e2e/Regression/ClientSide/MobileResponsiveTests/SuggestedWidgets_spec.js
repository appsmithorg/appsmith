import {
  autoLayout,
  dataSources,
  table,
  agHelper,
  apiPage,
  assertHelper,
  entityExplorer,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { PROPERTY_SELECTOR } from "../../../../locators/WidgetLocators";
import { EntityItems } from "../../../../support/Pages/AssertHelper";

describe("Check Suggested Widgets Feature in auto-layout", function () {
  before(() => {
    autoLayout.ConvertToAutoLayoutAndVerify(false);
    featureFlagIntercept(
      {
        ab_ds_binding_enabled: false,
      },
      false,
    );
    agHelper.RefreshPage();
  });

  it("1. Suggested widget", () => {
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved("SELECT * FROM configs LIMIT 10;");
    cy.intercept("/api/v1/actions/execute", {
      fixture: "addWidgetTable-mock",
    });
    dataSources.RunQuery({ toValidateResponse: false });
    dataSources.AddSuggestedWidget(Widgets.Table);
    table.ReadTableRowColumnData(1, 0, "v2").then((cellData) => {
      expect(cellData).to.eq("5");
    });
  });

  it("Bug 25432. Table widget bound to API with mock api url", () => {
    let apiName = "mockAPI";
    apiPage.CreateAndFillApi("https://mock-api.appsmith.com/users", apiName);
    apiPage.RunAPI();
    assertHelper.AssertNetworkStatus("@postExecute", 200);

    dataSources.AddSuggestedWidget(Widgets.Table);
    agHelper.AssertContains(
      apiName + ".data.users",
      "exist",
      PROPERTY_SELECTOR.tableData + " .CodeMirror",
    );

    agHelper.Sleep(500);
    entityExplorer.ExpandCollapseEntity("Queries/JS");
    entityExplorer.ActionContextMenuByEntityName({
      entityNameinLeftSidebar: apiName,
      action: "Delete",
      entityType: EntityItems.Api,
    });
  });
});
