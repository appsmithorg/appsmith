import { ColumnTypes } from "widgets/TableWidgetV2/constants";
import {
  getExportCellValue,
  neutralizeSpreadsheetFormula,
} from "./getExportCellValue";

describe("neutralizeSpreadsheetFormula", () => {
  it.each([
    ["=1+2", "'=1+2"],
    ["+1234", "'+1234"],
    ["-5", "'-5"],
    ["@SUM(A1)", "'@SUM(A1)"],
    ["\t=cmd", "'\t=cmd"],
    ["\r=cmd", "'\r=cmd"],
  ])("prefixes %j with a single quote", (input, expected) => {
    expect(neutralizeSpreadsheetFormula(input)).toBe(expected);
  });

  it.each(["hello", "1+2", "  =spaced", "completed"])(
    "leaves safe value %j unchanged",
    (input) => {
      expect(neutralizeSpreadsheetFormula(input)).toBe(input);
    },
  );
});

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

  it("neutralizes formula prefixes for every column type", () => {
    expect(getExportCellValue(ColumnTypes.TEXT, "=1+2")).toBe("'=1+2");
    expect(getExportCellValue(ColumnTypes.NUMBER, "-5")).toBe("'-5");
    expect(getExportCellValue(undefined, "+cmd")).toBe("'+cmd");
  });

  it("strips HTML then neutralizes formula text", () => {
    expect(getExportCellValue(ColumnTypes.HTML, "<b>=1+2</b>")).toBe("'=1+2");
  });

  it("leaves non-string values unchanged", () => {
    expect(getExportCellValue(ColumnTypes.NUMBER, -5)).toBe(-5);
    expect(getExportCellValue(ColumnTypes.TEXT, null)).toBe(null);
  });

  it("coerces number columns before neutralization when asNumber is set", () => {
    expect(
      getExportCellValue(ColumnTypes.NUMBER, "-5", { asNumber: true }),
    ).toBe(-5);
    expect(
      getExportCellValue(ColumnTypes.NUMBER, "12.5", { asNumber: true }),
    ).toBe(12.5);
    expect(
      getExportCellValue(ColumnTypes.NUMBER, "not-a-number", {
        asNumber: true,
      }),
    ).toBe(0);
  });

  it("skips formula neutralization when neutralizeFormulas is false", () => {
    expect(
      getExportCellValue(ColumnTypes.TEXT, "+1234", {
        neutralizeFormulas: false,
      }),
    ).toBe("+1234");
    expect(
      getExportCellValue(ColumnTypes.HTML, "<b>=1+2</b>", {
        neutralizeFormulas: false,
      }),
    ).toBe("=1+2");
  });
});
