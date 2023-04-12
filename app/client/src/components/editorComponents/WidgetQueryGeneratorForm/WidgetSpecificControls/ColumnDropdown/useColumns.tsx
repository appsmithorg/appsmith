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
import { getDatasourceTableColumns } from "selectors/entitiesSelector";
import { WidgetQueryGeneratorFormContext } from "../..";
import { DEFAULT_DROPDOWN_OPTION } from "../../constants";

export function useColumns(alias: string) {
  const { config, updateConfig } = useContext(WidgetQueryGeneratorFormContext);

  const isLoading = useSelector(getIsFetchingGsheetsColumns);

  const columns = useSelector(
    getDatasourceTableColumns(config.datasource.id, config.table.id),
  );

  const sheetColumns = useSelector(
    getGsheetsColumns(config.sheet.id + "_" + config.sheet.data.sheetURL),
  );

  const options = useMemo(() => {
    if (
      config.datasource.data.pluginPackageName ===
        PluginPackageName.GOOGLE_SHEETS &&
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
  }, [columns, sheetColumns, config]);

  const onSelect = useCallback(
    (column, columnObj) => {
      updateConfig(alias, columnObj);
    },
    [updateConfig, alias],
  );

  return {
    error:
      config.datasource.data.pluginPackageName ===
        PluginPackageName.GOOGLE_SHEETS && sheetColumns?.error,
    options,
    isLoading,
    onSelect,
    selected: get(config, alias, DEFAULT_DROPDOWN_OPTION),
    show:
      (config.datasource.data.pluginPackageName !==
        PluginPackageName.GOOGLE_SHEETS ||
        config.sheet.id !== DEFAULT_DROPDOWN_OPTION.id) &&
      config.table.id !== DEFAULT_DROPDOWN_OPTION.id,
  };
}
