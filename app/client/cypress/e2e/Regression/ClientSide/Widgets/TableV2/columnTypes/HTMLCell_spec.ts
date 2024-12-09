import { featureFlagIntercept } from "../../../../../../support/Objects/FeatureFlags";
import {
  agHelper,
  entityExplorer,
  propPane,
  table,
} from "../../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../../support/Pages/EditorNavigation";

describe("Table Filter for HTML Cell", function () {
  before(() => {
    featureFlagIntercept({
      release_table_html_column_type_enabled: true,
    });
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
});

const htmlTableData = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    role: undefined,
    status: null,
    applicationDate: "2024-02-15",
    lastUpdated: "2024-03-20",
    department: "Engineering",
  },
  {
    id: 2,
    name: "Emma Wilson",
    email: "emma.w@email.com",
    role: "Designer",
    status:
      "<span style='background-color: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;'><strong>Active</strong></span>",
    applicationDate: "2024-03-01",
    lastUpdated: "2024-03-19",
    department: "Design",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "m.brown@email.com",
    role: "Manager",
    status:
      "<span style='background-color: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;'><strong>Suspended</strong></span>",
    applicationDate: "2024-01-10",
    lastUpdated: "2024-03-18",
    department: "Operations",
  },
  {
    id: 4,
    name: "Sarah Davis",
    email: "sarah.d@email.com",
    role: "Developer",
    status:
      "<span style='background-color: #22c55e; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;'><strong>Active</strong></span>",
    applicationDate: "2024-02-20",
    lastUpdated: "2024-03-17",
    department: "Engineering",
  },
  {
    id: 5,
    name: "James Wilson",
    email: "j.wilson@email.com",
    role: "Analyst",
    status:
      "<span style='background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;'><strong>Reviewing</strong></span>",
    applicationDate: "2024-03-05",
    lastUpdated: "2024-03-16",
    department: "Analytics",
  },
];
