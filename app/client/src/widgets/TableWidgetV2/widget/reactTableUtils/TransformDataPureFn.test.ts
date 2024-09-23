import { ColumnTypes, DateInputFormat } from "widgets/TableWidgetV2/constants";
import { transformDataPureFn } from "./transformDataPureFn";
import type { ReactTableColumnProps } from "widgets/TableWidgetV2/component/Constants";

// Mock columns data
const columns = [
  {
    alias: "epoch",
    metaProperties: {
      type: ColumnTypes.DATE,
      inputFormat: DateInputFormat.EPOCH,
      format: "YYYY-MM-DD",
    },
  },
  {
    alias: "milliseconds",
    metaProperties: {
      type: ColumnTypes.DATE,
      inputFormat: DateInputFormat.MILLISECONDS,
      format: "YYYY-MM-DD",
    },
  },
  {
    alias: "iso_8601",
    metaProperties: {
      type: ColumnTypes.DATE,
      inputFormat: "YYYY-MM-DDTHH:mm:ss.SSSZ",
      format: "YYYY-MM-DD",
    },
  },
  {
    alias: "yyyy_mm_dd",
    metaProperties: {
      type: ColumnTypes.DATE,
      inputFormat: "YYYY-MM-DD",
      format: "YYYY-MM-DD",
    },
  },
  {
    alias: "lll",
    metaProperties: {
      type: ColumnTypes.DATE,
      inputFormat: "LLL",
      format: "YYYY-MM-DD",
    },
  },
];

// Mock table data
const tableData = [
  {
    epoch: "1727132400",
    milliseconds: "1727132400000",
    iso_8601: "2024-09-24T00:00:00.000+01:00",
    yyyy_mm_dd: "2024-09-24",
    lll: "September 25, 2024 12:00 AM",
  },
  {
    epoch: 1726980974,
    milliseconds: 1726980974328,
    iso_8601: "2024-09-23T09:01:53.350627",
    yyyy_mm_dd: "2024-09-23",
    lll: "Sep 23, 2024 09:01",
  },
];

// Expected transformed data
const expectedData = [
  {
    epoch: "2024-09-24", // Converted from epoch to date
    milliseconds: "2024-09-24", // Converted from milliseconds to date
    iso_8601: "2024-09-24", // ISO 8601 to date
    yyyy_mm_dd: "2024-09-24", // No transformation needed
    lll: "2024-09-25", // LLL format to date
  },
  {
    epoch: "2024-09-22", // Converted from epoch to date
    milliseconds: "2024-09-22", // Converted from milliseconds to date
    iso_8601: "2024-09-23", // ISO 8601 to date
    yyyy_mm_dd: "2024-09-23", // No transformation needed
    lll: "2024-09-23", // LLL format to date
  },
];

describe("transformDataPureFn", () => {
  it("should transform table data based on column meta properties", () => {
    const result = transformDataPureFn(
      tableData,
      columns as ReactTableColumnProps[],
    );

    expect(result).toEqual(expectedData);
  });

  it("should handle invalid date values", () => {
    const invalidTableData = [
      {
        epoch: "invalid_epoch",
        milliseconds: "invalid_milliseconds",
        iso_8601: "invalid_iso_8601",
        yyyy_mm_dd: "invalid_date",
        lll: "invalid_lll",
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

  it("should return an empty array when tableData is not an array", () => {
    const result = transformDataPureFn([], columns as ReactTableColumnProps[]);

    expect(result).toEqual([]);
  });
});
