import {
  table,
  entityExplorer,
  propPane,
  agHelper,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const data = [
  {
    name: "C.COM",
  },
  {
    name: "B.COM",
  },
  {
    name: "A.COM",
  },
];

describe(
  "Table V2 sort & filter using display text functionality",
  { tags: ["@tag.All", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
      // turn on filtering for the table - it is disabled by default in this PR(#34593)
      propPane.ExpandIfCollapsedSection("search\\&filters");
      agHelper.GetNClick(".t--property-control-allowfiltering input");
      propPane.EnterJSContext("Table data", JSON.stringify(data));
      assertHelper.AssertNetworkStatus("@updateLayout");
    });

    beforeEach(() => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
    });

    it("1. should search against display text when on client search", () => {
      propPane.TogglePropertyState("Client side search", "On");
      agHelper.Sleep(1000);
      table.ChangeColumnType("name", "URL", "v2");
      const colSettings = table._columnSettingsV2("name", "Edit");
      agHelper.GetNClick(colSettings);
      propPane.UpdatePropertyFieldValue(
        "Display text",
        "{{['X','Y','Z'][currentIndex]}}",
      );
      agHelper.TypeText(table._searchInput, "X");
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.eq("X");
      });
      agHelper.ClearTextField(table._searchInput);
      propPane.NavigateBackToPropertyPane();
    });

    it("2. should filter column using display text when filters are applied", () => {
      const colSettings = table._columnSettingsV2("name", "Edit");
      agHelper.GetNClick(colSettings);
      let columnType;
      propPane.GetSelectedItemText("columntype").then((text) => {
        columnType = text;
        if (columnType !== "URL") {
          propPane.NavigateBackToPropertyPane();
          table.ChangeColumnType("name", "URL", "v2");
          agHelper.GetNClick(colSettings);
        }
      });
      propPane.UpdatePropertyFieldValue(
        "Display text",
        "{{['X','Y','Z'][currentIndex]}}",
        true,
        false,
      );
      agHelper.RemoveUIElement("EvaluatedPopUp");
      table.OpenNFilterTable("name", "contains", "Y");
      table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
        expect($cellData).to.eq("Y");
      });
      table.RemoveFilter();
      propPane.NavigateBackToPropertyPane();
    });

    it("3. should sort column using display text", () => {
      const colSettings = table._columnSettingsV2("name", "Edit");
      agHelper.GetNClick(colSettings);
      let columnType;
      propPane.GetSelectedItemText("columntype").then((text) => {
        columnType = text;
        if (columnType !== "URL") {
          propPane.NavigateBackToPropertyPane();
          table.ChangeColumnType("name", "URL", "v2");
          agHelper.GetNClick(colSettings);
        }
      });
      propPane.UpdatePropertyFieldValue(
        "Display text",
        "{{['X','Y','Z'][currentIndex]}}",
        true,
        false,
      );
      table.SortColumn("name", "ascending");
      table.ReadTableRowColumnData(0, 0, "v2").then((data) => {
        expect(data).to.eq("X");
      });
      table.ReadTableRowColumnData(1, 0, "v2").then((data) => {
        expect(data).to.eq("Y");
      });
      table.ReadTableRowColumnData(2, 0, "v2").then((data) => {
        expect(data).to.eq("Z");
      });
    });
  },
);
