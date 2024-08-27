import {
  agHelper,
  draggableWidgets,
  locators,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";
import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Table widget date column inline editing functionality",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      agHelper.AddDsl("Table/DateCellEditingDSL");
    });

    it(
      "1. should check that edit check box is enabled for date type column in the columns list" +
        "and check that date cell edit mode can be turned on",
      () => {
        EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
        table.EditColumn("release_date", "v2");
        propPane.AssertPropertySwitchState("Editable", "disabled");
        propPane.TogglePropertyState("Editable", "On");
        agHelper.Sleep(1000);
        agHelper.AssertElementVisibility(
          `${table._tableV2Head} ${table._columnHeaderDiv("release_date")} ${
            locators._svg
          }`,
        );
      },
    );

    it("2. should check that user can edit date in table cell", () => {
      agHelper.GetElement(`${table._tableRow1Child3}`).dblclick();
      agHelper.GetNClick(
        `${table._dateInputPopover} [aria-label='Mon May 17 2021']`,
      );
      agHelper.AssertElementAbsence(table._dateInputPopover);
      agHelper.AssertElementAbsence(table._editCellEditor);
      agHelper.WaitUntilToastDisappear("onDateSelected");
      agHelper
        .GetText(`${table._tableRow1Child3}`)
        .then(($textData) => expect($textData).to.eq(`2021-05-17T00:00:00`));
      agHelper.GetElement(`${table._tableRow1Child3}`).dblclick({
        force: true,
      });
      agHelper.AssertElementVisibility(table._dateInputPopover);
      agHelper.AssertElementVisibility(table._editCellEditor);
      agHelper.GetNClick(
        `${locators._widgetInCanvas(draggableWidgets.TEXT)}`,
        0,
      );
      agHelper.AssertElementAbsence(table._dateInputPopover);
      agHelper.AssertElementAbsence(table._editCellEditor);
      agHelper.GetText(locators._textWidget, "text", 0).then(($textData) =>
        expect(JSON.parse($textData as string)).to.deep.eq({
          revenue: 42600000,
          imdb_id: "tt3228774",
          release_date: "2021-05-17",
        }),
      );
      agHelper.GetText(locators._textWidget, "text", 1).then(($textData) =>
        expect(JSON.parse($textData as string)).to.deep.eq([
          {
            index: 0,
            updatedFields: {
              release_date: "2021-05-17",
            },
            allFields: {
              revenue: 42600000,
              imdb_id: "tt3228774",
              release_date: "2021-05-17",
            },
          },
        ]),
      );
      agHelper
        .GetText(locators._textWidget, "text", 2)
        .then(($textData) => expect($textData).to.eq("[0]"));
    });

    it("3. should check that changing property pane display format for date column changes date display format", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.SelectPropertiesDropDown("Display format", "Do MMM YYYY");
      agHelper
        .GetText(`${table._tableRow1Child3}`)
        .then(($textData) => expect($textData).to.eq("17th May 2021"));
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.SelectPropertiesDropDown("Display format", "DD/MM/YYYY");
      agHelper
        .GetText(`${table._tableRow1Child3}`)
        .then(($textData) => expect($textData).to.eq("17/05/2021"));
    });

    it("4. should check that changing property pane first day of week changes the date picker starting day", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.UpdatePropertyFieldValue("First Day Of Week", "1", true);
      agHelper.GetElement(`${table._tableRow1Child3}`).dblclick({
        force: true,
      });
      agHelper
        .GetText(`${table._weekdayRowDayPicker} ${table._divFirstChild}`)
        .then(($textData) => expect($textData).to.eq("Mo"));
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.UpdatePropertyFieldValue("First Day Of Week", "5", true);
      agHelper.GetElement(`${table._tableRow1Child3}`).dblclick({
        force: true,
      });
      agHelper
        .GetText(`${table._weekdayRowDayPicker} ${table._divFirstChild}`)
        .then(($textData) => expect($textData).to.eq("Fr"));
    });

    it("5. should check Show Shortcuts property control functionality", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.TogglePropertyState("Show Shortcuts", "Off");
      agHelper.Sleep(2000);
      agHelper.GetElement(`${table._tableRow1Child3}`).dblclick({
        force: true,
      });
      agHelper.AssertElementAbsence(`${table._dateRangePickerShortcuts}`);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.TogglePropertyState("Show Shortcuts", "On");
      agHelper.Sleep(2000);
      agHelper.GetElement(`${table._tableRow1Child3}`).dblclick({
        force: true,
      });
      agHelper.AssertElementVisibility(`${table._dateRangePickerShortcuts}`);
    });

    it("6. should check property pane Required toggle functionality", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      table.EditColumn("release_date", "v2");
      propPane.TogglePropertyState("Required", "On");
      agHelper.Sleep(2000);
      //Edits the date by selecting from the popup
      table.ClickOnEditIcon(0, 2);
      agHelper.GetNClick(
        `${table._dateInputPopover} [aria-label='Wed May 26 2021']`,
      );
      //Clears the date selected in previous step
      table.ClickOnEditIcon(0, 2);
      agHelper.GetNClick(
        `${table._dateInputPopover} [aria-label='Wed May 26 2021']`,
      );
      agHelper
        .GetText(table._popoverErrorMsg("This field is required"))
        .then(($textData) => expect($textData).to.eq("This field is required"));
      agHelper.GetNClick(
        `${table._dateInputPopover} [aria-label='Wed May 26 2021']`,
      );
      agHelper.AssertElementAbsence(
        table._popoverErrorMsg("This field is required"),
      );
    });

    it("7. should check date cells behave as expected when adding a new row to table", () => {
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.NavigateBackToPropertyPane();
      propPane.TogglePropertyState("Allow adding a row", "On");
      table.AddNewRow();
      agHelper.AssertElementAbsence(table._datePicker);
      agHelper.AssertCSS(
        table._editCellEditor,
        "border",
        "1px solid rgb(242, 43, 43)",
      );
      agHelper
        .GetText(`${table._tableRow1Child3} ${locators._inputField}`)
        .then(($textData) => expect($textData).to.eq(""));
      agHelper.GetNClick(`${table._tableRow1Child3} ${locators._inputField}`);
      agHelper.AssertElementVisibility(table._datePicker);
      agHelper
        .GetElement(table._editCellEditor)
        .should("have.css", "border")
        .and("not.eq", "none")
        .and("not.eq", "1px solid rgb(255, 255, 255)");

      agHelper
        .GetText(
          `${table._dayPickerWeek}:nth-child(2) ${table._dayPickerFirstChild}`,
        )
        .then(($dayPickerFirstChild) => {
          agHelper.GetNClick(
            `${table._dayPickerWeek}:nth-child(2) ${table._dayPickerFirstChild}`,
          );
          agHelper
            .GetText(`${table._tableRow1Child3} ${locators._inputField}`, "val")
            .then(($textData: any) =>
              expect($textData).contains($dayPickerFirstChild),
            );
        });
    });
  },
);
