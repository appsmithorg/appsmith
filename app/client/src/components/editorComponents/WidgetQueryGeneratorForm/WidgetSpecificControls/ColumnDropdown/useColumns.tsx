import type { AppState } from "ce/reducers";
import { Colors } from "constants/Colors";
import { IconSize } from "design-system-old";
import { PluginPackageName } from "entities/Action";
import { ALLOWED_SEARCH_DATATYPE } from "pages/Editor/GeneratePage/components/constants";
import { useCallback, useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import { QueryGeneratorFormContext } from "../..";

export function useColumns() {
  const { config, updateConfig } = useContext(QueryGeneratorFormContext);

  const isLoading = useSelector((state: AppState) => {
    return state.entities.datasources.gsheetStructure.isFetchingColumns;
  });

  const columns = config.table.data.columns;

  const sheetColumns = useSelector((state: AppState) => {
    if (config.sheet.id) {
      return state.entities.datasources.gsheetStructure.columns[
        config.sheet.id
      ];
    } else {
      return [];
    }
  });

  const options = useMemo(() => {
    if (
      config.datasource.data.pluginPackageName ===
      PluginPackageName.GOOGLE_SHEETS
    ) {
      return sheetColumns.map((column) => {
        return {
          ...column,
          id: column.value,
          icon: "column",
          iconSize: IconSize.LARGE,
          iconColor: Colors.GOLD,
        };
      });
    } else {
      return columns
        .filter((column) => {
          return (
            column.type &&
            ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase())
          );
        })
        .map((column) => {
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
    }
  }, [columns, sheetColumns]);

  const onSelect = useCallback((alias, value) => {
    updateConfig(alias, value);
  }, []);

  return {
    options,
    isLoading,
    onSelect,
    selected: config.column,
  };
}
