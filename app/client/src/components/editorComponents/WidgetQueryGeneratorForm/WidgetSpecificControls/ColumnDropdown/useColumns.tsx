import type { AppState } from "ce/reducers";
import { Colors } from "constants/Colors";
import { IconSize } from "design-system-old";
import { PluginPackageName } from "entities/Action";
import { get, isArray } from "lodash";
import { ALLOWED_SEARCH_DATATYPE } from "pages/Editor/GeneratePage/components/constants";
import { useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getGsheetsColumns,
  getIsFetchingGsheetsColumns,
} from "selectors/datasourceSelectors";
import {
  getDatasourceTableColumns,
  getDatasourceTablePrimaryColumn,
  getPluginPackageFromDatasourceId,
} from "selectors/entitiesSelector";
import { WidgetQueryGeneratorFormContext } from "../..";

export function useColumns(alias: string) {
  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  const isLoading = useSelector(getIsFetchingGsheetsColumns);

  const columns = useSelector(
    getDatasourceTableColumns(config.datasource, config.table),
  );

  const sheetColumns = useSelector(
    getGsheetsColumns(config.sheet + "_" + config.table),
  );

  const primaryColumn = useSelector(
    getDatasourceTablePrimaryColumn(config.datasource, config.table),
  );

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  const options = useMemo(() => {
    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      isArray(sheetColumns?.value)
    ) {
      return sheetColumns.value.map((column: any) => {
        return {
          ...column,
          id: column.value,
          icon: "column",
          iconSize: IconSize.LARGE,
          iconColor: Colors.GOLD,
        };
      });
    } else if (isArray(columns)) {
      return columns
        .filter((column: any) => {
          return (
            column.type &&
            ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase())
          );
        })
        .map((column: any) => {
          return {
            id: column.name,
            label: column.name,
            value: column.name,
            subText: column.type,
            icon: "column",
            iconSize: IconSize.LARGE,
            iconColor: Colors.GOLD,
          };
        });
    } else {
      return [];
    }
  }, [columns, sheetColumns, config, selectedDatasourcePluginPackageName]);

  const onSelect = useCallback(
    (column, columnObj) => {
      updateConfig(alias, columnObj.value);
    },
    [updateConfig, alias],
  );

  return {
    error:
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      sheetColumns?.error,
    options,
    isLoading,
    onSelect,
    selected: options.find((option) => option.value === get(config, alias)),
    show:
      (selectedDatasourcePluginPackageName !==
        PluginPackageName.GOOGLE_SHEETS ||
        !!config.sheet) &&
      !!config.table,
    primaryColumn,
  };
}
