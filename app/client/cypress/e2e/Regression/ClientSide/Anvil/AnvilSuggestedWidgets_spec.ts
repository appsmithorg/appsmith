import { ANVIL_EDITOR_TEST } from "../../../../support/Constants";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";
import { dataSources } from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe(
  `${ANVIL_EDITOR_TEST}:Check Suggested Widgets Feature`,
  { tags: ["@tag.Anvil", "@tag.Testing"] },
  function () {
    beforeEach(() => {
      // intercept features call for Anvil + WDS tests
      featureFlagIntercept({
        release_anvil_enabled: true,
      });
    });
    it("1. Suggested wds widgets for anvil layout", () => {
      dataSources.CreateDataSource("Postgres");
      dataSources.CreateQueryAfterDSSaved("SELECT * FROM configs LIMIT 10;");
      cy.intercept("/api/v1/actions/execute", {
        fixture: "addWidgetTable-mock",
      });
      dataSources.RunQuery({ toValidateResponse: false });
      dataSources.AddSuggestedWidget(Widgets.WDSTable);
    });
  },
);
