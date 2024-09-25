import {
  agHelper,
  entityExplorer,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";
import { tableV2DateTestData } from "./fixtures";
import { getFormattedTomorrowDates } from "./helpers";

describe(
  "Table widget date column type validation",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      entityExplorer.DragNDropWidget("tablewidgetv2", 350, 500);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.ToggleJSMode("Table data", true);
      propPane.UpdatePropertyFieldValue("Table data", tableV2DateTestData);
    });

    afterEach(() => {
      propPane.NavigateBackToPropertyPane(false);
    });

    const setEditableDateFormats = (format: string) => {
      // Update date format property
      propPane.ToggleJSMode("Date format", true);
      propPane.UpdatePropertyFieldValue("Date format", format);

      // Update display format property
      propPane.ToggleJSMode("Display format", true);
      propPane.UpdatePropertyFieldValue("Display format", "YYYY-MM-DD");

      // Toggle editable
      propPane.TogglePropertyState("Editable", "On");
    };

    const clickAndValidateDateCell = (row: number, column: number) => {
      // Click unix cell edit
      table.ClickOnEditIcon(row, column);

      // Click on specific date within
      agHelper.GetNClick(
        `${table._dateInputPopover} [aria-label='${getFormattedTomorrowDates().verboseFormat}']`,
      );

      // Check that date is set in column
      table
        .ReadTableRowColumnData(row, column, "v2")
        .then((val) =>
          expect(val).to.equal(getFormattedTomorrowDates().isoFormat),
        );
    };

    it("1. should allow inline editing of Unix Timestamp in seconds (unix/s)", () => {
      table.ChangeColumnType("unix/s", "Date");
      setEditableDateFormats("Epoch");
      clickAndValidateDateCell(0, 0);
    });

    it("2. should allow inline editing of Unix Timestamp in milliseconds (unix/ms)", () => {
      table.ChangeColumnType("unix/ms", "Date");
      setEditableDateFormats("Milliseconds");
      clickAndValidateDateCell(0, 1);
    });

    it("3. should allow inline editing of date in YYYY-MM-DD format", () => {
      table.ChangeColumnType("yyyy-mm-dd", "Date");
      setEditableDateFormats("YYYY-MM-DD");
      clickAndValidateDateCell(0, 2);
    });

    it("4. should allow inline editing of date in YYYY-MM-DD HH:mm format", () => {
      table.ChangeColumnType("yyyy-mm-dd hh:mm", "Date");
      setEditableDateFormats("YYYY-MM-DD HH:mm");
      clickAndValidateDateCell(0, 3);
    });

    it("5. should allow inline editing of date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)", () => {
      table.ChangeColumnType("yyyy-mm-ddTHH:mm:ss", "Date");
      setEditableDateFormats("YYYY-MM-DDTHH:mm:ss");
      clickAndValidateDateCell(0, 4);
    });

    it("6. should allow inline editing of date in YYYY-MM-DD HH:mm:ss format", () => {
      table.ChangeColumnType("yyyy-mm-dd hh:mm:ss", "Date");
      setEditableDateFormats("YYYY-MM-DD HH:mm:ss");
      clickAndValidateDateCell(0, 5);
    });

    it("7. should allow inline editing of date in 'do MMM yyyy' format", () => {
      table.ChangeColumnType("do MMM yyyy", "Date");
      setEditableDateFormats("Do MMM YYYY");
      clickAndValidateDateCell(0, 6);
    });

    it("8. should allow inline editing of date in DD/MM/YYYY format", () => {
      table.ChangeColumnType("dd/mm/yyyy", "Date");
      setEditableDateFormats("DD/MM/YYYY");
      clickAndValidateDateCell(0, 7);
    });

    it("9. should allow inline editing of date in DD/MM/YYYY HH:mm format", () => {
      table.ChangeColumnType("dd/mm/yyyy hh:mm", "Date");
      setEditableDateFormats("DD/MM/YYYY HH:mm");
      clickAndValidateDateCell(0, 8);
    });

    it("10. should allow inline editing of date in LLL (Month Day, Year Time) format", () => {
      table.ChangeColumnType("lll", "Date");
      setEditableDateFormats("LLL");
      clickAndValidateDateCell(0, 9);
    });

    it("11. should allow inline editing of date in LL (Month Day, Year) format", () => {
      table.ChangeColumnType("ll", "Date");
      setEditableDateFormats("LL");
      clickAndValidateDateCell(0, 10);
    });

    it("12. should allow inline editing of date in 'D MMMM, YYYY' format", () => {
      table.ChangeColumnType("d mmmm, yyyy", "Date");
      setEditableDateFormats("D MMMM, YYYY");
      clickAndValidateDateCell(0, 11);
    });

    it("13. should allow inline editing of date in 'h:mm A D MMMM, YYYY' format", () => {
      table.ChangeColumnType("h:mm A d mmmm, yyyy", "Date");
      setEditableDateFormats("h:mm A D MMMM, YYYY");
      clickAndValidateDateCell(0, 12);
    });

    it("14. should allow inline editing of date in MM-DD-YYYY format", () => {
      table.ChangeColumnType("mm-dd-yyyy", "Date");
      setEditableDateFormats("MM-DD-YYYY");
      clickAndValidateDateCell(0, 13);
    });

    it("15. should allow inline editing of date in DD-MM-YYYY format", () => {
      table.ChangeColumnType("dd-mm-yyyy", "Date");
      setEditableDateFormats("DD-MM-YYYY");
      clickAndValidateDateCell(0, 14);
    });

    it("16. should allow inline editing of date in MM/DD/YYYY format", () => {
      table.ChangeColumnType("mm/dd/yyyy", "Date");
      setEditableDateFormats("MM/DD/YYYY");
      clickAndValidateDateCell(0, 15);
    });

    it("17. should allow inline editing of date in DD/MM/YY format", () => {
      table.ChangeColumnType("dd/mm/yy", "Date");
      setEditableDateFormats("DD/MM/YY");
      clickAndValidateDateCell(0, 16);
    });

    it("18. should allow inline editing of date in MM/DD/YY format", () => {
      table.ChangeColumnType("mm/dd/yy", "Date");
      setEditableDateFormats("MM/DD/YY");
      clickAndValidateDateCell(0, 17);
    });
  },
);
