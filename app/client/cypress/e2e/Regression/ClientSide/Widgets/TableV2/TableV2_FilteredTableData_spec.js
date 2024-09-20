import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../locators/commonlocators.json");
const publish = require("../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../fixtures/tableV2AndTextDsl.json");

import * as _ from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 Filtered Table data in autocomplete",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Sanity"] },
  function () {
    before("Table Widget V2 Functionality", () => {
      _.agHelper.AddDsl("tableV2AndTextDsl");
      cy.openPropertyPane("tablewidgetv2");
    });

    it("1. Table Widget V2 Functionality To Filter and search data", function () {
      cy.get(publish.searchInput).first().type("query");
      cy.get(publish.filterBtn).click({ force: true });
      cy.get(publish.attributeDropdown).click({ force: true });
      cy.get(publish.attributeValue).contains("task").click({ force: true });
      cy.get(publish.conditionDropdown).click({ force: true });
      cy.get(publish.attributeValue)
        .contains("contains")
        .click({ force: true });
      cy.get(publish.tableFilterInputValue).type("bind", { force: true });
      cy.wait(500);
      cy.get(widgetsPage.filterApplyBtn).click({ force: true });
      cy.wait(500);
      cy.get(".t--close-filter-btn").click({ force: true });
    });

    it("2. Table Widget V2 Functionality to validate filtered table data", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
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
  },
);
