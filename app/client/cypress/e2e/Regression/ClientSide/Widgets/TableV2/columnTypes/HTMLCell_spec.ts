import { htmlTableData } from "../../../../../../fixtures/htmlCellInTableWidgetV2";
import { featureFlagIntercept } from "../../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  entityExplorer,
  propPane,
  table,
} from "../../../../../../support/Objects/ObjectsCore";

describe(
  "Table Filter for HTML Cell",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
      propPane.EnterJSContext("Table data", JSON.stringify(htmlTableData));
    });

    it("1. Ensures HTML column type is available", function () {
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.include("Active");
      });
    });

    it("2. Verify HTML columns are searchable", function () {
      table.ReadTableRowColumnData(1, 3, "v2").then(($cellData) => {
        expect($cellData).to.include("Active");
        table.SearchTable($cellData);
        table.ReadTableRowColumnData(0, 3, "v2").then((afterSearch) => {
          expect(afterSearch).to.eq($cellData);
        });
      });
      table.RemoveSearchTextNVerify("1", "v2");
    });

    it("3. Verify Table Filter for HTML columns", function () {
      propPane.ExpandIfCollapsedSection("search\\&filters");
      agHelper.AssertExistingToggleState("Allow filtering", "false");
      propPane.TogglePropertyState("Allow filtering", "On");

      table.OpenNFilterTable("status", "contains", "Active");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.include("Active");
      });
      table.RemoveFilterNVerify("1", true, true, 0, "v2");

      table.OpenNFilterTable("status", "contains", "Suspended");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.include("Suspended");
      });
      table.RemoveFilterNVerify("1", true, true, 0, "v2");

      table.OpenNFilterTable("status", "empty", "");
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.include("1");
      });
      table.RemoveFilterNVerify("1", true, true, 0, "v2");

      table.OpenNFilterTable("status", "not empty", "");
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.include("2");
      });
      table.RemoveFilterNVerify("1", true, true, 0, "v2");
    });

    it("4. Verify Table sorting for HTML columns", function () {
      table.SortColumn("status", "asc");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.include("Active");
      });
      table.SortColumn("status", "desc");
      table.ReadTableRowColumnData(0, 3, "v2").then(($cellData) => {
        expect($cellData).to.include("Suspended");
      });
    });
  },
);
