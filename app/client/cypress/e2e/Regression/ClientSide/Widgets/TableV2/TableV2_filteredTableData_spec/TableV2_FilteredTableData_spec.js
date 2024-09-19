import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../../support/Pages/EditorNavigation";

const widgetsPage = require("../../../../../../locators/Widgets.json");
const commonlocators = require("../../../../../../locators/commonlocators.json");
const publish = require("../../../../../../locators/publishWidgetspage.json");
const dsl = require("../../../../../../fixtures/tableV2AndTextDsl.json");
import { firstJSObjectBody, secondJSObjectBody } from "./Fixture";

import {
  agHelper,
  table,
  locators,
  jsEditor,
} from "../../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 Filtered Table data in autocomplete",
  { tags: ["@tag.Widget", "@tag.Table"] },
  function () {
    before("Table Widget V2 Functionality", () => {
      agHelper.AddDsl("tableV2AndTextDsl");
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

    it.only("3. When primary key is set, selectedRowIndex should not updated after data update", function () {
      // https://github.com/appsmithorg/appsmith/issues/36080
      jsEditor.CreateJSObject(firstJSObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      });
      jsEditor.CreateJSObject(secondJSObjectBody, {
        paste: true,
        completeReplace: true,
        toRun: true,
        shouldCreateNewJSObj: true,
        prettify: true,
      });
      PageLeftPane.switchSegment(PagePaneSegment.UI);

      agHelper.AddDsl("tableV2FilteringWithPrimaryColumn");
      table.SearchTable("Engineering");
      table.ReadTableRowColumnData(2, 0, "v2").then((text) => {
        expect(text).to.equal("Michael Wilson");
      });

      table.SelectTableRow(2, 0, true, "v2");

      agHelper.GetText(locators._textWidget, "text").then((text) => {
        agHelper.ClickButton("Submit");

        table.ReadTableRowColumnData(2, 0, "v2").then((text) => {
          expect(text).to.equal("Michael Wilson1");
        });
        agHelper.AssertText(locators._textWidget, "text", text);
      });
    });
  },
);
