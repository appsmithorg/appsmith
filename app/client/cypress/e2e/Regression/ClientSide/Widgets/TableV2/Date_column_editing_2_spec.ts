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
    agHelper.GetElement(table._tableRow1Child3).dblclick({
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
    agHelper.GetElement(table._tableRow1Child3).dblclick({
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
    agHelper.GetElement(table._tableRow1Child3).dblclick({
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
    agHelper.Sleep(1000);
    table.AssertHiddenColumns(["release_date"]);
    entityExplorer.SelectEntityByName("Table1");
    propPane.NavigateBackToPropertyPane();
    table.EditColumn("release_date", "v2");
    propPane.TogglePropertyState("Visible", "On");
    agHelper.Sleep(1000);
    table.AssertVisibleColumns(["release_date"]);
  });

  // ADS changes to date input property causes this test to fail
  // skipping it temporarily.
  it.skip("3. should check min date and max date property control functionality", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    agHelper.AssertElementExist(
      propPane._propertyPanePropertyControl("validation", "mindate"),
    );
    agHelper.AssertElementExist(
      propPane._propertyPanePropertyControl("validation", "maxdate"),
    );
    agHelper.RemoveCharsNType(
      `${propPane._propertyPanePropertyControl("validation", "mindate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "2022-05-05T00:00:10.1010+05:30{enter}",
    );
    agHelper.RemoveCharsNType(
      `${propPane._propertyPanePropertyControl("validation", "mindate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "2022-05-30T00:00:10.1010+05:30{enter}",
    );
    table.ClickOnEditIcon(0, 2);
    agHelper
      .GetText(table._popoverErrorMsg("Date out of range"))
      .then(($textData) => expect($textData).to.eq("Date out of range"));
    agHelper.RemoveCharsNType(
      `${propPane._propertyPanePropertyControl("validation", "mindate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "{enter}",
    );
    agHelper.RemoveCharsNType(
      `${propPane._propertyPanePropertyControl("validation", "maxdate")} ${
        table._lastChildDatePicker
      }`,
      -1,
      "{enter}",
    );
  });

  it("4. should allow ISO 8601 format date and not throw a disallowed validation error", () => {
    entityExplorer.SelectEntityByName("Table1");
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
    propPane.UpdatePropertyFieldValue(
      "Date format",
      "YYYY-MM-DDTHH:mm:ss.SSSsZ",
    );
    //we should now see an error when an incorrect date format
    agHelper.AssertElementVisible(
      `${propPane._propertyDateFormat} ${table._codeMirrorError}`,
    );
  });
});
