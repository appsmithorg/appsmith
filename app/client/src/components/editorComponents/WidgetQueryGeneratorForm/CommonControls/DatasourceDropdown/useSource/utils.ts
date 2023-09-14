import { DatasourceConnectionMode } from "entities/Datasource";

export const getGSheetsConnectionMode = (scopeString = "") => {
  if (!scopeString) {
    return DatasourceConnectionMode.READ_ONLY;
  }
  const scopeArray = scopeString.split(",");
  if (scopeArray.some((scope) => scope.includes("spreadsheets.readonly"))) {
    return DatasourceConnectionMode.READ_ONLY;
  } else {
    return DatasourceConnectionMode.READ_WRITE;
  }
};
