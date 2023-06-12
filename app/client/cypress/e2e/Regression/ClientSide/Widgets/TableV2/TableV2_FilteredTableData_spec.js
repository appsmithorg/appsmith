const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tableV2AndTextDsl.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";
import { table } from "../../../../../support/Objects/ObjectsCore";

describe("Table Widget V2 Filtered Table data in autocomplete", function () {
  before("Table Widget V2 Functionality", () => {
    cy.addDsl(dsl);
    cy.openPropertyPane("tablewidgetv2");
    cy.wait("@updateLayout");
  });

  it("1. Table Widget V2 Functionality To Filter and search data", function () {
    cy.get(publish.searchInput).first().type("query");
    cy.get(publish.filterBtn).click({ force: true });
    cy.get(publish.attributeDropdown).click({ force: true });
    cy.get(publish.attributeValue).contains("task").click({ force: true });
    cy.get(publish.conditionDropdown).click({ force: true });
    cy.get(publish.attributeValue).contains("contains").click({ force: true });
    cy.get(publish.tableFilterInputValue).type("bind", { force: true });
    cy.wait(500);
    cy.get(widgetsPage.filterApplyBtn).click({ force: true });
    cy.wait(500);
    cy.get(".t--close-filter-btn").click({ force: true });
  });

  it("2. Table Widget V2 Functionality to validate filtered table data", function () {
    _.entityExplorer.SelectEntityByName("Text1");
    cy.testJsontext("text", "{{Table1.filteredTableData[0].task}}");
    cy.readTableV2data("0", "1").then((tabData) => {
      const tableData = tabData;
      cy.get(commonlocators.labelTextStyle).should("have.text", tableData);
    });

    //Table Widget V2 Functionality to validate filtered table data with actual table data
    cy.readTableV2data("0", "1").then((tabData) => {
      const tableData = JSON.parse(dsl.dsl.children[0].tableData);
      cy.get(commonlocators.labelTextStyle).should(
        "have.text",
        tableData[2].task,
      );
    });
  });

  it("3. Table Widget V2 Functionality to validate filtered table data for URL columntype", function () {
    _.entityExplorer.SelectEntityByName("Table1");
    _.propPane.ToggleOnOrOff("clientsidesearch", "On");
    cy.wait(2000);
    const colSettings = table._columnSettingsV2("docs");
    _.agHelper.GetNClick(colSettings);
    cy.wait(3000);
    cy.testJsontext(
      "displaytext",
      "{{`${currentRow.task[1]}${currentRow.task[3]}`}}",
    );
    cy.wait(3000);
    cy.get(publish.searchInput).first().clear().type("id");
    cy.get(publish.filterBtn).click({ force: true });
    cy.get(publish.attributeDropdown).click({ force: true });
    cy.get(publish.attributeValue).contains("docs").click({ force: true });
    cy.get(publish.conditionDropdown).click({ force: true });
    cy.get(publish.attributeValue).contains("contains").click({ force: true });
    cy.get(publish.tableFilterInputValue).clear().type("id", { force: true });
    cy.wait(500);
    cy.get(widgetsPage.filterApplyBtn).click({ force: true });
    cy.wait(500);
    cy.get(".t--close-filter-btn").click({ force: true });
  });

  it("4. Table Widget V2 Functionality to validate filtered table data for URL column type", function () {
    _.entityExplorer.SelectEntityByName("Text1");
    cy.testJsontext("text", "{{Table1.filteredTableData[0].task}}");
    cy.readTableV2data("0", "1").then((tabData) => {
      const tableData = tabData;
      cy.get(commonlocators.labelTextStyle).should("have.text", tableData);
    });

    //Table Widget V2 Functionality to validate filtered table data with actual table data
    cy.readTableV2data("0", "1").then((tabData) => {
      const tableData = JSON.parse(dsl.dsl.children[0].tableData);
      cy.get(commonlocators.labelTextStyle).should(
        "have.text",
        tableData[2].task,
      );
    });
  });
});
