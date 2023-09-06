import type { AppState } from "@appsmith/reducers";
import { PluginPackageName } from "entities/Action";
import { isArray } from "lodash";
import { useContext, useMemo } from "react";
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
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import { getWidget } from "sagas/selectors";
import { useColumnDropdown } from "./useColumnDropdown";

export function useColumns(alias: string, isSearcheable: boolean) {
  const {
    config,
    excludePrimaryColumnFromQueryGeneration,
    propertyName,
    updateConfig,
    widgetId,
  } = useContext(WidgetQueryGeneratorFormContext);

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const isLoading = useSelector(getIsFetchingGsheetsColumns);

  const columns = useSelector(
    getDatasourceTableColumns(config.datasource, config.table),
  );

  const sheetColumns = useSelector(
    getGsheetsColumns(config.sheet + "_" + config.table),
  );

  let primaryColumn = useSelector(
    getDatasourceTablePrimaryColumn(config.datasource, config.table),
  );

  // TODO(Balaji): Abstraction leak. remove when backend sends this data
  if (!primaryColumn && config.datasourcePluginName === "MongoDB") {
    primaryColumn = "_id";
  }

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  const columnDropdownProps = {
    alias,
    columns,
    config,
    isSearcheable,
    propertyName,
    selectedDatasourcePluginPackageName,
    sheetColumns,
    updateConfig,
    widget,
  };

  const { onClear, onSelect, options, selected } = useColumnDropdown({
    ...columnDropdownProps,
  });

  const prepareColumns = (type: string) => {
    switch (type) {
      case "int4":
      case "int2":
      case "Integer":
      case "Double":
        return "number";
      case "varchar":
      case "text":
      case "String":
        return "string";
      case "date":
      case "timestamptz":
        return "date";
      case "Array":
        return "array";
      default:
        return "string";
    }
  };

  const columnList = useMemo(() => {
    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      isArray(sheetColumns?.value)
    ) {
      return sheetColumns.value.map((column: any) => {
        return {
          name: column.value,
          type: "string",
          isSelected: true,
        };
      });
    } else if (isArray(columns)) {
      return columns.map((column: any) => {
        return {
          name: column.name,
          type: prepareColumns(column.type),
          isSelected:
            column.name === primaryColumn
              ? !excludePrimaryColumnFromQueryGeneration
              : column?.isSelected === undefined || column?.isSelected,
        };
      });
    } else {
      return [];
    }
  }, [columns, sheetColumns, config, selectedDatasourcePluginPackageName]);

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  return {
    error:
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      sheetColumns?.error,
    options,
    isLoading,
    onSelect,
    selected,
    show:
      (selectedDatasourcePluginPackageName !==
        PluginPackageName.GOOGLE_SHEETS ||
        !!config.sheet) &&
      !!config.table,
    primaryColumn,
    columns: columnList,
    disabled: isConnecting,
    onClear,
  };
}
