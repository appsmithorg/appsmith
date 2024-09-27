import type { ReactTableColumnProps } from "widgets/TableWidgetV2/component/Constants";
import {
  columns,
  columnsNonDate,
  expectedData,
  expectedDataNonDate,
  tableData,
  tableDataNonDate,
} from "./fixtures";
import { transformDataPureFn } from "./transformDataPureFn";

describe("transformDataPureFn", () => {
  it("should transform table data based on column meta properties", () => {
    let result = transformDataPureFn(
      [tableData[0]],
      columns as ReactTableColumnProps[],
    );

    expect(result[0]).toEqual(expectedData[0]);

    result = transformDataPureFn(
      [tableData[1]],
      columns as ReactTableColumnProps[],
    );
    expect(result[0]).toEqual(expectedData[1]);
  });

  it("should handle invalid date values", () => {
    const invalidTableData = [
      {
        epoch: "invalid_epoch",
        milliseconds: "invalid_milliseconds",
        iso_8601: "invalid_iso_8601",
        yyyy_mm_dd: "invalid_date",
        lll: "invalid_date",
      },
    ];

    const expectedInvalidData = [
      {
        epoch: "Invalid date",
        milliseconds: "Invalid date",
        iso_8601: "8601-01-01",
        yyyy_mm_dd: "Invalid date",
        lll: "Invalid date",
      },
    ];

    const result = transformDataPureFn(
      invalidTableData,
      columns as ReactTableColumnProps[],
    );

    expect(result).toEqual(expectedInvalidData);
  });

  it("should return an empty array when tableData is empty", () => {
    const result = transformDataPureFn([], columns as ReactTableColumnProps[]);

    expect(result).toEqual([]);
  });

  it("should not transform non-date data", () => {
    const result = transformDataPureFn(
      tableDataNonDate,
      columnsNonDate as ReactTableColumnProps[],
    );

    expect(result).toEqual(expectedDataNonDate);
  });
});
