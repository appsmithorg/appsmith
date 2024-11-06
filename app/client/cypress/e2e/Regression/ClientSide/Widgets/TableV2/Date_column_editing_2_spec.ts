import {
  agHelper,
  dataSources,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

import { datePickerlocators } from "../../../../../locators/WidgetLocators";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Table widget date column inline editing functionality",
  { tags: ["@tag.Widget", "@tag.Table", "@tag.Binding"] },
  () => {
    before(() => {
      agHelper.AddDsl("Table/DateCellEditingDSL");
    });

    it("1. should check visible property control functionality", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      table.EditColumn("release_date", "v2");
      propPane.TogglePropertyState("Visible", "Off");
      agHelper.Sleep(1000);
      table.AssertHiddenColumns(["release_date"]);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.TogglePropertyState("Visible", "On");
      agHelper.Sleep(1000);
      table.AssertVisibleColumns(["release_date"]);
    });

    it("2. should check min date and max date property control functionality", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.TogglePropertyState("Editable", "On");
      agHelper.AssertElementExist(
        propPane._propertyPanePropertyControl("validation", "mindate"),
      );
      agHelper.AssertElementExist(
        propPane._propertyPanePropertyControl("validation", "maxdate"),
      );
      agHelper.GetNClick(locators._existingFieldTextByName("Min Date"));
      agHelper.GetNClick(datePickerlocators.calendarHeader, 2);
      agHelper.GetNClick(datePickerlocators.year("2022"), 0, true);
      agHelper.GetNClick(datePickerlocators.calendarHeader, 1);
      agHelper.GetNClick(dataSources._visibleTextSpan("May"), 0, true);
      agHelper.GetNClick(datePickerlocators.date("005"));
      agHelper.PressEnter();
      agHelper.GetNClick(locators._existingFieldTextByName("Min Date"));
      agHelper.GetNClick(datePickerlocators.calendarHeader, 2);
      agHelper.GetNClick(datePickerlocators.year("2022"), 0, true);
      agHelper.GetNClick(datePickerlocators.date("030"));
      table.ClickOnEditIcon(0, 2);
      agHelper
        .GetText(table._popoverErrorMsg("Date out of range"))
        .then(($textData) => expect($textData).to.eq("Date out of range"));

      agHelper.GetNClick(locators._existingFieldTextByName("Min Date"));
      agHelper.ClickButton("Clear");

      agHelper.GetNClick(locators._existingFieldTextByName("Max Date"));
      agHelper.ClickButton("Clear");

      table.ClickOnEditIcon(0, 2);
      agHelper.AssertElementAbsence(
        table._popoverErrorMsg("Date out of range"),
      );
    });

    it("3. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      propPane.UpdatePropertyFieldValue(
        "Table data",
        '[{ "dateValue": "2023-02-02T13:39:38.367857Z" }]',
      );
      agHelper.Sleep(3000);
      table.ChangeColumnType("dateValue", "Date", "v2");
      table.EditColumn("dateValue", "v2");
      propPane.SelectPropertiesDropDown("Date format", "ISO 8601");
      // we should not see an error after selecting the ISO 8061 format
      agHelper.AssertElementAbsence(
        `${propPane._propertyDateFormat} ${table._codeMirrorError}`,
      );
      propPane.ToggleJSMode("Date format", true);
      agHelper
        .GetText(locators._existingFieldTextByName("Date format"))
        .then(($textData) =>
          expect($textData).to.include("YYYY-MM-DDTHH:mm:ss.SSSZ"),
        );
    });
  },
);
