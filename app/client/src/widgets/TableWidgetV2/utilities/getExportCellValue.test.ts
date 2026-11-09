import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import { getExportCellValue } from "./getExportCellValue";

describe("getExportCellValue", () => {
  it("strips markup for HTML columns", () => {
    expect(
      getExportCellValue(
        ColumnTypes.HTML,
        '<span style="color:white">completed</span>',
      ),
    ).toBe("completed");
  });

  it("keeps markup for non-HTML columns", () => {
    expect(getExportCellValue(ColumnTypes.TEXT, "<p>abc</p>")).toBe(
      "<p>abc</p>",
    );
  });

  it("passes through values when column type is missing", () => {
    expect(getExportCellValue(undefined, "<p>abc</p>")).toBe("<p>abc</p>");
  });
});
