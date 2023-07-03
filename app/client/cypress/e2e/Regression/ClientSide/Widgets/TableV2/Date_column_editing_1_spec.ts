import {
  table,
  entityExplorer,
  agHelper,
  locators,
  propPane,
} from "../../../../../support/Objects/ObjectsCore";

describe("Table widget date column inline editing functionality", () => {
  before(() => {
    cy.fixture("Table/DateCellEditingDSL").then((val) => {
      agHelper.AddDsl(val);
    });
  });

  it("1. should check that edit check box is enabled for date type column in the columns list", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.AssertElementEnabledDisabled(table._releaseDateCheckbox, 0, false);
  });

  it("2. should check that date cell edit mode can be turned on", () => {
    entityExplorer.SelectEntityByName("Table1");
    table.EditColumn("release_date", "v2");
    agHelper.AssertElementExist(table._propertyControlEditable);
    agHelper.GetNClick(
      table._propertyControlEditable + " input[type=checkbox]",
    );
    agHelper.AssertElementExist(
      `${locators._widgetInCanvas(
        "tablewidgetv2 .thead",
      )} [data-header="release_date"] svg`,
    );
  });

  it("3. should check that user can edit date in table cell", () => {
    agHelper
      .GetElement(`${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`)
      .dblclick();
    agHelper.AssertElementExist(table._dateInputPopover);
    agHelper.AssertElementExist(table._cellEditor);
    agHelper.GetNClick(
      `${table._dateInputPopover} [aria-label='Mon May 17 2021']`,
    );
    agHelper.AssertElementAbsence(table._dateInputPopover);
    agHelper.AssertElementAbsence(table._cellEditor);
    agHelper.GetNAssertContains(
      `${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`,
      "2021-05-17T00:00:00",
    );
    agHelper
      .GetElement(`${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`)
      .dblclick({
        force: true,
      });
    agHelper.AssertElementExist(table._dateInputPopover);
    agHelper.AssertElementExist(table._cellEditor);
    agHelper.GetNClick(`${locators._widgetInCanvas("textwidget")}`, 0);
    agHelper.AssertElementAbsence(table._dateInputPopover);
    agHelper.AssertElementAbsence(table._cellEditor);
    agHelper.GetNAssertContains(
      `[type='CANVAS_WIDGET'] ${locators._widgetInDeployed(
        "textwidget",
      )} ${locators._widgetInCanvas("textwidget")} span`,
      `{"revenue":42600000,"imdb_id":"tt3228774","release_date":"2021-05-17"}`,
    );
    agHelper.GetNAssertContains(
      `[type='CANVAS_WIDGET'] ${locators._widgetInDeployed(
        "textwidget",
      )}+${locators._widgetInDeployed("textwidget")} ${locators._widgetInCanvas(
        "textwidget",
      )} span`,
      `[{"index":0,"updatedFields":{"release_date":"2021-05-17"},"allFields":{"revenue":42600000,"imdb_id":"tt3228774","release_date":"2021-05-17"}}]`,
    );
    agHelper.GetNAssertContains(
      `[type='CANVAS_WIDGET']  ${locators._widgetInDeployed(
        "textwidget",
      )}+${locators._widgetInDeployed(
        "textwidget",
      )}+${locators._widgetInDeployed("textwidget")} ${locators._widgetInCanvas(
        "textwidget",
      )} span`,
      "[0]",
    );
  });

  it("4. should check that changing property pane display format for date column changes date display format", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    agHelper.GetNClick(
      `${locators._propertyControl}displayformat .rc-select-show-arrow`,
    );
    agHelper
      .GetElement(locators._dropdownText)
      .children()
      .contains("Do MMM YYYY")
      .click();
    agHelper.GetNAssertContains(
      `${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`,
      "17th May 2021",
    );

    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    agHelper.GetNClick(
      `${locators._propertyControl}displayformat .rc-select-show-arrow`,
    );
    agHelper
      .GetElement(locators._dropdownText)
      .children()
      .contains("DD/MM/YYYY")
      .click();
    agHelper.GetNAssertContains(
      `${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`,
      "17/05/2021",
    );
  });

  it("5. should check that changing property pane first day of week changes the date picker starting day", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    propPane.UpdatePropertyFieldValue("First Day Of Week","1",true)
    // agHelper.TypeText(
    //   `${locators._propertyControl}firstdayofweek .t--code-editor-wrapper`,
    //   "{backspace}1",
    //   0,
    // );
    agHelper
      .GetElement(`${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`)
      .dblclick({
        force: true,
      });
    agHelper.GetNAssertContains(
      `${table._weekdayRowDayPicker} div:first-child abbr`,
      "Mo",
    );

    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    propPane.UpdatePropertyFieldValue("First Day Of Week","5",true)
    agHelper
      .GetElement(`${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`)
      .dblclick({
        force: true,
      });
    agHelper.GetNAssertContains(
      `${table._weekdayRowDayPicker} div:first-child abbr`,
      "Fr",
    );
  });

  it("6. should check Show Shortcuts property control functionality", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    agHelper.AssertElementExist(`${table._propertyControlShowShortcuts}`);
    agHelper.GetNClick(
      `${table._propertyControlShowShortcuts} input[type=checkbox]`,
    );
    agHelper
      .GetElement(`${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`)
      .dblclick({
        force: true,
      });
    agHelper.AssertElementAbsence(
      `${table._dateInputPopover}.bp3-daterangepicker-shortcuts`,
    );

    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    agHelper.AssertElementExist(table._propertyControlShowShortcuts);
    agHelper.GetNClick(
      `${table._propertyControlShowShortcuts} input[type=checkbox]`,
    );
    agHelper
      .GetElement(`${table._tableV2Row} .tr:nth-child(1) div:nth-child(3)`)
      .dblclick({
        force: true,
      });
    agHelper.AssertElementExist(
      `${table._dateInputPopover} .bp3-daterangepicker-shortcuts`,
    );
  });

  it("7. should check property pane Required toggle functionality", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    table.EditColumn("release_date", "v2");
    agHelper.AssertElementExist(table._propertyControlRequired);
    agHelper.GetNClick(
      `${table._propertyControlRequired} input[type=checkbox]`,
    );
    agHelper.HoverElement(
      `${table._tableV2Row} .tr:nth-child(1) .td:nth-child(3)`,
    );
    agHelper.GetNClick(table._editCellIconDiv, 0, true);
    agHelper.GetNClick(
      `${table._dateInputPopover} [aria-label='Wed May 26 2021']`,
    );
    agHelper.HoverElement(
      `${table._tableV2Row} .tr:nth-child(1) .td:nth-child(3)`,
    );
    agHelper.GetNClick(table._editCellIconDiv, 0, true);
    agHelper.GetNClick(
      `${table._dateInputPopover} [aria-label='Wed May 26 2021']`,
    );
    agHelper.AssertElementExist(table._popoverContent);
    agHelper.GetNAssertContains(
      table._popoverContent,
      "This field is required",
    );
    agHelper.GetNClick(
      `${table._dateInputPopover} [aria-label='Wed May 26 2021']`,
    );
    agHelper.AssertElementAbsence(table._popoverContent);
  });

  it("8. should check date cells behave as expected when adding a new row to table", () => {
    entityExplorer.SelectEntityByName("Table1");
    agHelper.GetNClick(locators._propertypaneBackButton);
    agHelper.GetNClick(table._allowAddRowCheckbox);
    agHelper.GetNClick(table._addNewRow);
    agHelper.AssertElementAbsence(table._datePicker);
    agHelper.AssertCSS(
      table._cellEditor,
      "border",
      "1px solid rgb(255, 255, 255)",
    );
    agHelper.AssertValue(
      `${table._tableV2Row} .tr:nth-child(1) div:nth-child(3) input`,
      "",
    );
    agHelper.GetNClick(
      `${table._tableV2Row} .tr:nth-child(1) div:nth-child(3) input`,
    );
    agHelper.AssertElementExist(table._datePicker);
    agHelper
      .GetElement(table._cellEditor)
      .should("have.css", "border")
      .and("not.eq", "none")
      .and("not.eq", "1px solid rgb(255, 255, 255)");
    agHelper.GetNClick(
      `${table._dayPickerWeek}:nth-child(2) .DayPicker-Day:first-child`,
    );
    agHelper.AssertValue(
      `${table._tableV2Row} .tr:nth-child(1) div:nth-child(3) input`,
      "",
      false,
    );
  });
});
