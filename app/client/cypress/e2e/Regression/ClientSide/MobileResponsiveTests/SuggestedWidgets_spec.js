import {
  autoLayout,
  dataSources,
  table,
  agHelper,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe(
  "Check Suggested Widgets Feature in auto-layout",
  { tags: ["@tag.MobileResponsive"] },
  function () {
    before(() => {
      autoLayout.ConvertToAutoLayoutAndVerify(false);
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
  },
);
