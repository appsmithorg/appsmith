import * as _ from "../../../../../support/Objects/ObjectsCore";
import { table } from "../../../../../support/Objects/ObjectsCore";

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

describe("Table V2 sort & filter using display text functionality", () => {
  before(() => {
    _.entityExplorer.DragDropWidgetNVerify("tablewidgetv2", 650, 250);
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
    _.table.AddSampleTableData();
    _.propPane.UpdatePropertyFieldValue("Table data", JSON.stringify(data));
    cy.wait("@updateLayout");
    cy.wait(1000);
  });

  beforeEach(() => {
    _.entityExplorer.SelectEntityByName("Table1", "Widgets");
  });

  it("1. should search against display text when on client search", () => {
    _.propPane.TogglePropertyState("clientsidesearch", "On");
    cy.wait(2000);
    table.ChangeColumnType("name", "URL", "v2");
    const colSettings = table._columnSettingsV2("name");
    _.agHelper.GetNClick(colSettings);
    _.propPane.UpdatePropertyFieldValue(
      "Display text",
      "{{['X','Y','Z'][currentIndex]}}",
    );
    cy.get(table._searchInput).type("X");
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("X");
    });
    cy.get(table._searchInput).clear();
    _.propPane.NavigateBackToPropertyPane();
  });

  it("2. should filter column using display text when filters are applied", () => {
    const colSettings = table._columnSettingsV2("name");
    _.agHelper.GetNClick(colSettings);
    let columnType;
    cy.get(".t--property-control-columntype span.rc-select-selection-item span")
      .invoke("text")
      .then((text) => {
        columnType = text;
        if (columnType !== "URL") {
          _.propPane.NavigateBackToPropertyPane();
          _.table.ChangeColumnType("name", "URL", "v2");
          _.agHelper.GetNClick(colSettings);
        }
      });
    _.propPane.UpdatePropertyFieldValue(
      "Display text",
      "{{['X','Y','Z'][currentIndex]}}",
    );
    table.OpenNFilterTable("name", "contains", "Y");
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("Y");
    });
    table.RemoveFilter();
    _.propPane.NavigateBackToPropertyPane();
  });

  it("3. should sort column using display text", () => {
    const colSettings = table._columnSettingsV2("name");
    _.agHelper.GetNClick(colSettings);
    let columnType;
    cy.get(".t--property-control-columntype span.rc-select-selection-item span")
      .invoke("text")
      .then((text) => {
        columnType = text;
        if (columnType !== "URL") {
          _.propPane.NavigateBackToPropertyPane();
          _.table.ChangeColumnType("name", "URL", "v2");
          _.agHelper.GetNClick(colSettings);
        }
      });
    _.propPane.UpdatePropertyFieldValue(
      "Display text",
      "{{['X','Y','Z'][currentIndex]}}",
    );
    table.sortColumn("name", "ascending");
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
});
