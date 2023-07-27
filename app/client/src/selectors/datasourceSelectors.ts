import type { AppState } from "@appsmith/reducers";

export const getGsheetSpreadsheets =
  (id = "") =>
  (state: AppState) => {
    return state.entities.datasources.gsheetStructure.spreadsheets[id];
  };

export const getIsFetchingGsheetSpreadsheets = (state: AppState) =>
  state.entities.datasources.gsheetStructure.isFetchingSpreadsheets;

export const getGsheetsSheets =
  (id = "") =>
  (state: AppState) => {
    return state.entities.datasources.gsheetStructure.sheets[id];
  };

export const getisFetchingGsheetsSheets = (state: AppState) =>
  state.entities.datasources.gsheetStructure.isFetchingSheets;

export const getGsheetsColumns =
  (id = "") =>
  (state: AppState) => {
    return state.entities.datasources.gsheetStructure.columns[id];
  };

export const getIsFetchingGsheetsColumns = (state: AppState) => {
  return state.entities.datasources.gsheetStructure.isFetchingColumns;
};
