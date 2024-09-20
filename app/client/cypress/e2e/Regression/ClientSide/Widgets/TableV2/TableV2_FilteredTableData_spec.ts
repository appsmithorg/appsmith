import EditorNavigation, {
  EntityType,
  PageLeftPane,
  PagePaneSegment,
} from "../../../../../support/Pages/EditorNavigation";

import dsl from "../../../../../fixtures/tableV2AndTextDsl.json";
import widgetsPage from "../../../../../locators/Widgets.json";
import commonlocators from "../../../../../locators/commonlocators.json";
import publish from "../../../../../locators/publishWidgetspage.json";

import { tableDataJSObject } from "../../../../../fixtures/tableV2FilteringWithPrimaryColumnJSObjectWidthData";
import {
  agHelper,
  jsEditor,
  locators,
  table,
} from "../../../../../support/Objects/ObjectsCore";

describe(
  "Table Widget V2 Filtered Table data in autocomplete",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Sanity"] },
  function () {
    before("Table Widget V2 Functionality", () => {
      agHelper.AddDsl("tableV2AndTextDsl");
      agHelper.GetNClick(locators._widgetInCanvas("tablewidgetv2"));
    });

    it("1. Table Widget V2 Functionality To Filter and search data", function () {
      table.SearchTable("query");
      agHelper.GetNClick(publish.filterBtn, 0, true);
      agHelper.GetNClick(publish.attributeDropdown, 0, true);

      agHelper
        .GetElement(publish.attributeValue)
        .contains("task")
        .click({ force: true });
      agHelper.GetNClick(publish.conditionDropdown, 0, true);
      agHelper
        .GetElement(publish.attributeValue)
        .contains("contains")
        .click({ force: true });
      agHelper.TypeText(publish.tableFilterInputValue, "bind");

      agHelper.GetNClick(widgetsPage.filterApplyBtn, 0, true);
      table.CloseFilter();
    });

    it("2. Table Widget V2 Functionality to validate filtered table data", function () {
      EditorNavigation.SelectEntityByName("Text1", EntityType.Widget);
      (cy as any).testJsontext("text", "{{Table1.filteredTableData[0].task}}");
      table.ReadTableRowColumnData(0, 1, "v2").then((tabData: string) => {
        agHelper.AssertText(
          commonlocators.labelTextStyle,
          "text",
          tabData as string,
        );
      });

      //Table Widget V2 Functionality to validate filtered table data with actual table data
      const tableData = JSON.parse(dsl.dsl.children[0].tableData as string);
      agHelper.AssertText(
        commonlocators.labelTextStyle,
        "text",
        tableData[1].task as string,
      );
    });

    it("3. When primary key is set, selectedRowIndex should not updated after data update", function () {
      // https://github.com/appsmithorg/appsmith/issues/36080
      jsEditor.CreateJSObject(tableDataJSObject, {
        paste: true,
        completeReplace: true,
        toRun: false,
        shouldCreateNewJSObj: true,
        prettify: true,
      });
      jsEditor.CreateJSObject(manipulateDataJSObject, {
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
        agHelper.AssertText(locators._textWidget, "text", text as string);
      });
    });
  },
);

export const manipulateDataJSObject = `export default {
	data: JSObject1.initData,
	makeNewCopy() {
		const my = _.cloneDeep(this.data);
		my[5].name =my[5].name+"1";
		this.data = my;
	}
}`;
