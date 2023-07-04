import {
  table,
  entityExplorer,
  agHelper,
  locators,
  propPane,
  assertHelper,
} from "../../../../../support/Objects/ObjectsCore";

describe("Table widget date column inline editing functionality", () => {
  before(() => {
    agHelper.AddDsl("Table/DateCellEditingDSL");
  });

  it.skip("1. should check that changing property pane time precision changes the date picker time precision", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    agHelper.GetNClick(table._timeprecisionPopover, 0);
    agHelper
      .GetElement(locators._dropdownText)
      .children()
      .contains("Minute")
      .click();
    agHelper.GetElement(table._tableNthChild).dblclick({
      force: true,
    });
    agHelper.AssertElementExist(table._timePickerHour);
    agHelper.AssertElementExist(table._timePickerMinute);
    agHelper.AssertElementAbsence(table._timePickerSecond);

    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    agHelper.GetNClick(table._timeprecisionPopover, 0);
    agHelper
      .GetElement(locators._dropdownText)
      .children()
      .contains("None")
      .click();
    agHelper.GetElement(table._tableNthChild).dblclick({
      force: true,
    });
    agHelper.AssertElementAbsence(table._timePickerRow);

    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    agHelper.GetNClick(table._timeprecisionPopover, 1);
    agHelper
      .GetElement(locators._dropdownText)
      .children()
      .contains("Second")
      .click();
    agHelper.GetElement(table._tableNthChild).dblclick({
      force: true,
    });
    agHelper.AssertElementExist(table._timePickerHour);
    agHelper.AssertElementExist(table._timePickerMinute);
    agHelper.AssertElementExist(table._timePickerSecond);
  });

  it("2. should check visible property control functionality", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    propPane.TogglePropertyState("Visible", "Off");
    assertHelper.AssertNetworkStatus("updateLayout", 200);
    agHelper.AssertElementExist(
      `${table._tableV2Head} ${table._releaseDateHeader} ${table._hiddenHeader}`,
    );
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    propPane.TogglePropertyState("Visible", "On");
    assertHelper.AssertNetworkStatus("updateLayout", 200);
    agHelper.AssertElementExist(
      `${table._tableV2Head} ${table._releaseDateHeader} ${table._draggableHeader}`,
    );
  });

  // ADS changes to date input property causes this test to fail
  // skipping it temporarily.
  it.skip("3. should check min date and max date property control functionality", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    agHelper.AssertElementExist(
      table._propertyPanePropertyControl("validation", "mindate"),
    );
    agHelper.AssertElementExist(
      table._propertyPanePropertyControl("validation", "maxdate"),
    );
    agHelper.RemoveCharsNType(
      `${table._propertyPanePropertyControl("validation", "mindate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "2022-05-05T00:00:10.1010+05:30{enter}",
    );
    agHelper.RemoveCharsNType(
      `${table._propertyPanePropertyControl("validation", "mindate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "2022-05-30T00:00:10.1010+05:30{enter}",
    );

    agHelper.HoverElement(`${table._tableDataNthChild}`);
    agHelper.GetNClick(table._editCellIconDiv, 0, true);
    agHelper.GetNAssertContains(table._popoverContent, "Date out of range");
    agHelper.RemoveCharsNType(
      `${table._propertyPanePropertyControl("validation", "mindate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "{enter}",
    );
    agHelper.RemoveCharsNType(
      `${table._propertyPanePropertyControl("validation", "maxdate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "{enter}",
    );
  });

  it("4. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    agHelper.UpdateCodeInput(
      `${locators._propertyControl}tabledata`,
      '[{ "dateValue": "2023-02-02T13:39:38.367857Z" }]',
    );
    agHelper.Sleep(3000);
    table.ChangeColumnType("dateValue", "Date", "v2");
    table.EditColumn("dateValue", "v2");
    propPane.SelectPropertiesDropDown("dateformat", "ISO 8601");
    // we should not see an error after selecting the ISO 8061 format
    agHelper.AssertElementAbsence(
      `${table._propertyDateFormat} ${table._codeMirrorError}`,
    );
    propPane.ToggleJSMode("dateformat", true);
    //check the selected format value
    agHelper.GetNAssertContains(
      `${table._propertyDateFormat}`,
      "YYYY-MM-DDTHH:mm:ss.SSSZ",
    );
    agHelper.UpdateCodeInput(
      `${table._propertyDateFormat}`,
      "YYYY-MM-DDTHH:mm:ss.SSSsZ",
    );
    //we should now see an error when an incorrect date format
    agHelper.AssertElementExist(
      `${table._propertyDateFormat} ${table._codeMirrorError}`,
    );
  });
});
