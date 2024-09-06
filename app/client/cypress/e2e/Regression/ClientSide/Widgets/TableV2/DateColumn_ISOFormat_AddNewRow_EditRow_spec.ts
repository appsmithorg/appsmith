import {
  entityExplorer,
  draggableWidgets,
  propPane,
  agHelper,
  table,
  locators,
} from "../../../../../support/Objects/ObjectsCore";

const tableData = `[
    {
      "step": "#1",
      "task": "Drop a table",
      "Date": "2021-05-25 12:00"
    },
    {
      "step": "#2",
      "task": "Create a query fetch_users with the Mock DB",
      "Date": "2021-05-27 14:30"
    },
    {
      "step": "#3",
      "task": "Bind the query using => fetch_users.data",
      "Date": "2021-05-29 16:45"
    }
  ]`;

describe(
  "Table Widget V2 - Add New Row and Edit Date Column",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      entityExplorer.DragDropWidgetNVerify(draggableWidgets.TABLE);
      propPane.EnterJSContext("Table data", tableData);
    });

    it("1. Verify Date column is visible and editable", () => {
      propPane.TogglePropertyState("Allow adding a row", "On");
      // enabling the editable option for the three columns
      table.EditColumn("Date", "v2");
      propPane.TogglePropertyState("Editable", "On");
      propPane.SelectPropertiesDropDown("Date format", "YYYY-MM-DD");

      table.AddNewRow();
      agHelper
        .GetText(`${table._tableRow1Child3} ${locators._inputField}`)
        .then(($textData) => expect($textData).to.eq(""));
      const datepickerLocator = `${table._tableRow1Child3} ${locators._inputField}`;
      agHelper.GetNClick(datepickerLocator, 0, true);
      agHelper
        .GetElement(`.bp3-datepicker-day-wrapper`)
        .contains("11")
        .click({ force: true });

      // add a text widget to check the values
      cy.dragAndDropToCanvas("textwidget", { x: 300, y: 600 });
      propPane.UpdatePropertyFieldValue("Text", `{{Table1.newRow.Date}}`);
      agHelper.GetText(locators._textWidget, "text").then(($text: any) => {
        expect($text).to.eq(getYYYYMMDDForThisMonth("11"));
      });
    });
  },
);

const getYYYYMMDDForThisMonth = (date: string): string => {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${date}`;
};
