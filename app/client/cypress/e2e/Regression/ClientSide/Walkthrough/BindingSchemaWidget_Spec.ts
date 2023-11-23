import {
  agHelper,
  dataSources,
  propPane,
} from "../../../../support/Objects/ObjectsCore";
import { addIndexedDBKey } from "../../../../support/commands";
import {
  USER_SIGN_UP_INDEX_KEY,
  WALKTHROUGH_TEST_PAGE,
} from "../../../../support/Constants";
import { Widgets } from "../../../../support/Pages/DataSources";

let datasourceName;
describe(`${WALKTHROUGH_TEST_PAGE} : Walkthrough test for schema on action page`, () => {
  before(() => {
    dataSources.CreateDataSource("Postgres");
    cy.get("@dsName").then(($dsName) => {
      datasourceName = $dsName;
    });
    addIndexedDBKey(USER_SIGN_UP_INDEX_KEY, {
      [Cypress.env("USERNAME")]: Date.now(),
    });
  });

  it("1. Schema walkthrough should appear", () => {
    dataSources.CreateQueryAfterDSSaved("select * from users limit 10");
    agHelper.WaitUntilEleAppear(agHelper._walkthroughOverlay);
    agHelper.AssertElementExist(
      agHelper._walkthroughOverlayTitle("Query data fast"),
    );
    agHelper.GetNClick(agHelper._walkthroughOverlayClose);
  });

  it("2. Binding walkthrough should appear", () => {
    dataSources.RunQuery();
    agHelper.WaitUntilEleAppear(agHelper._walkthroughOverlay);
    agHelper.AssertElementExist(
      agHelper._walkthroughOverlayTitle("Display your data"),
    );
    agHelper.GetNClick(agHelper._walkthroughOverlayClose);
  });

  it("3. Widget walkthrough should appear", () => {
    dataSources.AddSuggestedWidget(Widgets.Table);
    agHelper.WaitUntilEleAppear(agHelper._walkthroughOverlay);
    agHelper.AssertElementExist(
      agHelper._walkthroughOverlayTitle("Widget properties"),
    );
    agHelper.GetElement(propPane._paneTitle).contains("Table1");
    agHelper.GetNClick(agHelper._walkthroughOverlayClose);
  });
});
