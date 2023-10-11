import { isNumber } from "lodash";
import WidgetQueryGeneratorRegistry from "utils/WidgetQueryGeneratorRegistry";
import type { DatasourceStorage } from "entities/Datasource";

export const getSheetUrl = (sheetId: string): string =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=0`;

export const isValidGsheetConfig = (config: Record<string, any>) =>
  config.sheet &&
  config.tableHeaderIndex &&
  isNumber(Number(config.tableHeaderIndex)) &&
  !isNaN(Number(config.tableHeaderIndex)) &&
  config.tableHeaderIndex > 0;

export const getDatasourceConnectionMode = (
  pluginPackageName: string,
  datasourceConfiguration?: DatasourceStorage["datasourceConfiguration"],
) => {
  const queryGenerator = WidgetQueryGeneratorRegistry.get(pluginPackageName);

  return queryGenerator?.getConnectionMode(datasourceConfiguration);
};
