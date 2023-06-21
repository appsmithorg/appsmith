import {
  autoLayout,
  dataSources,
  table,
} from "../../../../support/Objects/ObjectsCore";
import { Widgets } from "../../../../support/Pages/DataSources";

describe("Check Suggested Widgets Feature in auto-layout", function () {
  before(() => {
    autoLayout.ConvertToAutoLayoutAndVerify(false);
  });

  it("1. Suggested widget", () => {
    dataSources.CreateDataSource("Postgres");
    dataSources.CreateQueryAfterDSSaved("SELECT * FROM configs LIMIT 10;");
    cy.intercept("/api/v1/actions/execute", {
      fixture: "addWidgetTable-mock",
    });
    dataSources.RunQuery({ toValidateResponse: false });
    dataSources.AddSuggesstedWidget(Widgets.Table);
    table.ReadTableRowColumnData(1, 0, "v2").then((cellData) => {
      expect(cellData).to.eq("5");
    });
  });
});
