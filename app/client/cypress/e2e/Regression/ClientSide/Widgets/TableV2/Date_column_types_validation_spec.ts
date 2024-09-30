import { tableDateColumnTypes } from "../../../../../fixtures/tableDateColumnTypes";
import {
  agHelper,
  entityExplorer,
  propPane,
  table,
} from "../../../../../support/Objects/ObjectsCore";

import EditorNavigation, {
  EntityType,
} from "../../../../../support/Pages/EditorNavigation";

describe(
  "Table widget date column type validation",
  { tags: ["@tag.Widget", "@tag.Table"] },
  () => {
    before(() => {
      entityExplorer.DragNDropWidget("tablewidgetv2", 350, 500);
      EditorNavigation.SelectEntityByName("Table1", EntityType.Widget);
      propPane.ToggleJSMode("Table data", true);
      propPane.UpdatePropertyFieldValue("Table data", tableDateColumnTypes);
      table.EditColumn("unixs", "v2");
    });

    beforeEach(() => {
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
        `${table._dateInputPopover} [aria-label='${table.getFormattedTomorrowDates().verboseFormat}']`,
      );

      // Check that date is set in column
      table
        .ReadTableRowColumnData(row, column, "v2")
        .then((val) =>
          expect(val).to.equal(table.getFormattedTomorrowDates().isoFormat),
        );
    };

    it("1. should allow inline editing of Unix Timestamp in seconds (unix/s)", () => {
      table.ChangeColumnType("unixs", "Date");
      setEditableDateFormats("Epoch");
      clickAndValidateDateCell(0, 0);
    });

    it("2. should allow inline editing of Unix Timestamp in milliseconds (unix/ms)", () => {
      table.ChangeColumnType("unixms", "Date");
      setEditableDateFormats("Milliseconds");
      clickAndValidateDateCell(0, 1);
    });

    it("3. should allow inline editing of date in YYYY-MM-DD format", () => {
      table.EditColumn("yyyymmdd", "v2");
      setEditableDateFormats("YYYY-MM-DD");
      clickAndValidateDateCell(0, 2);
    });

    it("4. should allow inline editing of date in YYYY-MM-DD HH:mm format", () => {
      table.EditColumn("yyyymmddhhmm", "v2");
      setEditableDateFormats("YYYY-MM-DD HH:mm");
      clickAndValidateDateCell(0, 3);
    });

    it("5. should allow inline editing of date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss)", () => {
      table.EditColumn("iso8601", "v2");
      setEditableDateFormats("YYYY-MM-DDTHH:mm:ss");
      clickAndValidateDateCell(0, 4);
    });

    it("6. should allow inline editing of date in YYYY-MM-DD HH:mm format", () => {
      table.EditColumn("yyyymmddTHHmmss", "v2");
      setEditableDateFormats("YYYY-MM-DD HH:mm");
      clickAndValidateDateCell(0, 5);
    });

    it("7. should allow inline editing of date in 'do MMM yyyy' format", () => {
      table.ChangeColumnType("yyyymmddhhmmss", "Date");
      setEditableDateFormats("YYYY-MM-DDTHH:mm:ss");
      clickAndValidateDateCell(0, 6);
    });

    it("8. should allow inline editing of date in DD/MM/YYYY format", () => {
      table.ChangeColumnType("doMMMyyyy", "Date");
      setEditableDateFormats("Do MMM YYYY");
      clickAndValidateDateCell(0, 7);
    });

    it("9. should allow inline editing of date in DD/MM/YYYY HH:mm format", () => {
      table.EditColumn("ddmmyyyy", "v2");
      setEditableDateFormats("DD/MM/YYYY");
      clickAndValidateDateCell(0, 8);
    });

    it("10. should allow inline editing of date in LLL (Month Day, Year Time) format", () => {
      table.EditColumn("ddmmyyyyhhmm", "v2");
      setEditableDateFormats("DD/MM/YYYY HH:mm");
      clickAndValidateDateCell(0, 9);
    });

    it("11. should allow inline editing of date in LL (Month Day, Year) format", () => {
      table.EditColumn("lll", "v2");
      setEditableDateFormats("LLL");
      clickAndValidateDateCell(0, 10);
    });

    it("12. should allow inline editing of date in 'D MMMM, YYYY' format", () => {
      table.EditColumn("ll", "v2");
      setEditableDateFormats("LL");
      clickAndValidateDateCell(0, 11);
    });

    it("13. should allow inline editing of date in 'h:mm A D MMMM, YYYY' format", () => {
      table.EditColumn("dmmmmyyyy", "v2");
      setEditableDateFormats("D MMMM, YYYY");
      clickAndValidateDateCell(0, 12);
    });

    it("14. should allow inline editing of date in MM-DD-YYYY format", () => {
      table.EditColumn("hmmAdmmmmyyyy", "v2");
      setEditableDateFormats("H:mm A D MMMM, YYYY");
      clickAndValidateDateCell(0, 13);
    });

    it("15. should allow inline editing of date in DD-MM-YYYY format", () => {
      table.EditColumn("mm1dd1yyyy", "v2");
      setEditableDateFormats("MM-DD-YYYY");
      clickAndValidateDateCell(0, 14);
    });
  },
);
