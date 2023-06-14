const dsl = require("../../../../../fixtures/tableV2NewDsl.json");
import { ObjectsRegistry } from "../../../../../support/Objects/Registry";
import * as _ from "../../../../../support/Objects/ObjectsCore";
import { table } from "../../../../../support/Objects/ObjectsCore";
const publish = require("../../../../../locators/publishWidgetspage.json");

const propPane = ObjectsRegistry.PropertyPane;
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
    cy.addDsl(dsl);
    cy.openPropertyPane("tablewidgetv2");
    propPane.UpdatePropertyFieldValue("Table data", JSON.stringify(data));
    cy.wait("@updateLayout");
    cy.wait(1000);
  });

  beforeEach(() => {
    cy.openPropertyPane("tablewidgetv2");
  });

  it("1. should search against display text when on client search", () => {
    _.propPane.ToggleOnOrOff("clientsidesearch", "On");
    cy.wait(2000);
    const colSettings = table._columnSettingsV2("name");
    _.agHelper.GetNClick(colSettings);
    cy.changeColumnType("URL");
    cy.testJsontext("displaytext", "{{['X','Y','Z'][currentIndex]}}");
    cy.get(publish.searchInput).first().type("X");
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("X");
    });
    cy.get(publish.searchInput).first().clear();
    cy.backFromPropertyPanel();
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
          cy.changeColumnType("URL");
        }
      });

    cy.testJsontext("displaytext", "{{['X','Y','Z'][currentIndex]}}");
    table.OpenNFilterTable("name", "contains", "Y");
    table.ReadTableRowColumnData(0, 0, "v2").then(($cellData) => {
      expect($cellData).to.eq("Y");
    });
    table.RemoveFilter();
    cy.backFromPropertyPanel();
  });

  it("3. should sort column using display text", () => {
    const colSettings = table._columnSettingsV2("name");
    _.agHelper.GetNClick(colSettings);
    let columnType;
    cy.get(".t--property-control-columntype span.rc-select-selection-item span")
      .invoke("text")
      .then((text) => {
        console.log(text);
        columnType = text;
        if (columnType !== "URL") {
          cy.changeColumnType("URL");
        }
      });

    cy.testJsontext("displaytext", "{{['X','Y','Z'][currentIndex]}}");
    cy.sortColumn("name", "ascending");
    cy.readTableV2data(0, 0).then((data) => {
      expect(data).to.eq("X");
    });
    cy.readTableV2data(1, 0).then((data) => {
      expect(data).to.eq("Y");
    });
    cy.readTableV2data(2, 0).then((data) => {
      expect(data).to.eq("Z");
    });
  });
});
