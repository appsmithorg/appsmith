import React from "react";
import type { AppState } from "@appsmith/reducers";
import { Icon } from "design-system";
import { PluginPackageName } from "entities/Action";
import { get, isArray } from "lodash";
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
import { DropdownOption as Option } from "../../CommonControls/DatasourceDropdown/DropdownOption";
import {
  getOneClickBindingSelectedColumns,
  getisOneClickBindingConnectingForWidget,
} from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getWidget } from "sagas/selectors";

export function useColumns(alias: string) {
  const { config, propertyName, updateConfig, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const isLoading = useSelector(getIsFetchingGsheetsColumns);

  const columns = useSelector(
    getDatasourceTableColumns(config.datasource, config.table),
  );

  const selectedColumns = useSelector((state: AppState) =>
    getOneClickBindingSelectedColumns(state),
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

  const options = useMemo(() => {
    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      isArray(sheetColumns?.value)
    ) {
      return sheetColumns.value.map((column: any) => {
        return {
          ...column,
          id: column.value,
          icon: (
            <Icon
              color="var(--ads-v2-color-fg)"
              name="layout-column-line"
              size="md"
            />
          ),
        };
      });
    } else if (isArray(columns)) {
      return columns.map((column: any) => {
        return {
          id: column.name,
          label: column.name,
          value: column.name,
          subText: column.type,
          icon: (
            <Icon
              color="var(--ads-v2-color-fg)"
              name="layout-column-line"
              size="md"
            />
          ),
        };
      });
    } else {
      return [];
    }
  }, [columns, sheetColumns, config, selectedDatasourcePluginPackageName]);

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
      const columns = sheetColumns.value.map((column: any) => {
        return {
          name: column.value,
          type: "string",
          isSelected: true,
        };
      });
      return { columns, selectedColumnNames: config.selectedColumnNames };
    } else if (isArray(columns)) {
      const allColumns = columns.map((column: any) => {
        return {
          name: column.name,
          type: prepareColumns(column.type),
          isSelected:
            column.name === primaryColumn
              ? false
              : column?.isSelected === undefined || column?.isSelected,
        };
      });
      return {
        columns: allColumns,
        selectedColumnNames: config.selectedColumnNames,
      };
    } else {
      return { columns: [], selectedColumnNames: undefined };
    }
  }, [columns, sheetColumns, config, selectedDatasourcePluginPackageName]);

  const onSelect = useCallback(
    (column, columnObj) => {
      updateConfig(alias, columnObj.value);

      if (column) {
        AnalyticsUtil.logEvent(`GENERATE_QUERY_SET_COLUMN`, {
          columnAlias: alias,
          columnName: columnObj.value,
          widgetName: widget.widgetName,
          widgetType: widget.type,
          propertyName: propertyName,
          pluginType: config.datasourcePluginType,
          pluginName: config.datasourcePluginName,
          connectionMode: config.datasourceConnectionMode,
        });
      }
    },
    [updateConfig, alias, widget, config],
  );

  const onClear = useCallback(() => {
    updateConfig(alias, "");
  }, [updateConfig]);

  const selectedValue = get(config, alias);

  const selected = useMemo(() => {
    if (selectedValue) {
      const option = options.find((option) => option.value === selectedValue);

      return {
        label: <Option label={option?.label} leftIcon={option?.icon} />,
        key: option?.id,
      };
    }
  }, [selectedValue, options]);

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
    columns: columnList.columns,
    selectedColumnNames: selectedColumns,
    disabled: isConnecting,
    onClear,
  };
}
