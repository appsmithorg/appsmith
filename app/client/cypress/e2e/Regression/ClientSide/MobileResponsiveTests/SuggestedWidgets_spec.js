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
});
