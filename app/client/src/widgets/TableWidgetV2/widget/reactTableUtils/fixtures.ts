import { ColumnTypes, DateInputFormat } from "widgets/TableWidgetV2/constants";

// Mock columns data
export const columns = [
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
export const tableData = [
  {
    epoch: 1727132400,
    milliseconds: 1727132400000,
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
export const expectedData = [
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

// Mock columns for non-date data
export const columnsNonDate = [
  {
    id: "role",
    alias: "role",
    metaProperties: {
      type: ColumnTypes.NUMBER,
      format: "",
      inputFormat: "",
      decimals: 0,
    },
  },
  {
    id: "id",
    alias: "id",
    metaProperties: {
      type: ColumnTypes.NUMBER,
      format: "",
      inputFormat: "",
      decimals: 0,
    },
  },
  {
    id: "name",
    alias: "name",
    metaProperties: {
      type: ColumnTypes.TEXT,
      format: "",
      inputFormat: "",
      decimals: 0,
    },
  },
];

// Mock table data for non-date transformation
export const tableDataNonDate = [
  {
    role: 1,
    id: 1,
    name: "Alice Johnson",
    __originalIndex__: 0,
  },
  {
    role: 2,
    id: 2,
    name: "Bob Smith",
    __originalIndex__: 1,
  },
];

// Expected transformed data for non-date columns
export const expectedDataNonDate = [
  {
    role: 1,
    id: 1,
    name: "Alice Johnson",
  },
  {
    role: 2,
    id: 2,
    name: "Bob Smith",
  },
];
