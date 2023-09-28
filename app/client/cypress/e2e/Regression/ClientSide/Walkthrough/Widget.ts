import { agHelper, dataSources } from "../../../../support/Objects/ObjectsCore";
import { addIndexedDBKey } from "../../../../support/commands";
import {
  FEATURE_WALKTHROUGH_INDEX_KEY,
  USER_SIGN_UP_INDEX_KEY,
  WALKTHROUGH_TEST_PAGE,
} from "../../../../support/Constants";
import { Widgets } from "../../../../support/Pages/DataSources";

let datasourceName;
describe(`${WALKTHROUGH_TEST_PAGE} : Walkthrough test for widget added via binding UI from action page`, () => {
  before(() => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
    addIndexedDBKey(FEATURE_WALKTHROUGH_INDEX_KEY, {
      ab_ds_binding_enabled: true,
      ab_ds_schema_enabled: true,
      binding_widget: false,
    });

    addIndexedDBKey(USER_SIGN_UP_INDEX_KEY, {
      [Cypress.env("USERNAME")]: Date.now(),
    });
  });

  it("Widget walkthrough should appear", () => {
    dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
    dataSources.RunQuery();
    dataSources.AddSuggestedWidget(Widgets.Table);
    agHelper.WaitUntilEleAppear(agHelper._walkthroughOverlay);
  });
});
