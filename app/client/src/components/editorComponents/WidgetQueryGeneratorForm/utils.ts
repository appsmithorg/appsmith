import { isNumber } from "lodash";

export const getSheetUrl = (sheetId: string): string =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=0`;

export const isValidGsheetConfig = (config: Record<string, any>) =>
  config.sheet &&
  config.tableHeaderIndex &&
  isNumber(Number(config.tableHeaderIndex)) &&
  !isNaN(Number(config.tableHeaderIndex)) &&
  config.tableHeaderIndex > 0;
