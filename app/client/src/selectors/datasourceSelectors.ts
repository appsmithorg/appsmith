import type { DefaultRootState } from "react-redux";

export const getGsheetSpreadsheets =
  (id = "") =>
  (state: DefaultRootState) => {
    return state.entities.datasources.gsheetStructure.spreadsheets[id];
  };

export const getIsFetchingGsheetSpreadsheets = (state: DefaultRootState) =>
  state.entities.datasources.gsheetStructure.isFetchingSpreadsheets;

export const getGsheetsSheets =
  (id = "") =>
  (state: DefaultRootState) => {
    return state.entities.datasources.gsheetStructure.sheets[id];
  };

export const getisFetchingGsheetsSheets = (state: DefaultRootState) =>
  state.entities.datasources.gsheetStructure.isFetchingSheets;

export const getGsheetsColumns =
  (id = "") =>
  (state: DefaultRootState) => {
    return state.entities.datasources.gsheetStructure.columns[id];
  };

export const getIsFetchingGsheetsColumns = (state: DefaultRootState) => {
  return state.entities.datasources.gsheetStructure.isFetchingColumns;
};

export const getFirstDatasourceId = (state: DefaultRootState) => {
  const { list } = state.entities.datasources;

  if (list.length) {
    return list[0].id;
  }
};

export const getLoadingTokenForDatasourceId = (state: DefaultRootState) =>
  state.entities.datasources.loadingTokenForDatasourceId;

export const getDatasourcesLoadingState = (state: DefaultRootState) =>
  state.entities.datasources.loading;
