import React, { useCallback, useMemo } from "react";
import { PluginPackageName } from "entities/Action";
import { get, isArray } from "lodash";
import { ALLOWED_SEARCH_DATATYPE } from "pages/Editor/GeneratePage/components/constants";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { DropdownOption as Option } from "../../CommonControls/DatasourceDropdown/DropdownOption";
import type { DropdownOptionType } from "../../types";

export function useColumnDropdown(props: any) {
  const {
    alias,
    columns,
    config,
    isSearcheable,
    propertyName,
    selectedDatasourcePluginPackageName,
    sheetColumns,
    updateConfig,
    widget,
  } = props;

  const options: DropdownOptionType[] = useMemo(() => {
    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      isArray(sheetColumns?.value)
    ) {
      return sheetColumns.value.map((column: any) => {
        return {
          ...column,
          id: column.value,
        };
      });
    } else if (isArray(columns)) {
      return columns
        .filter((column: any) => {
          return (
            !isSearcheable ||
            (column.type &&
              ALLOWED_SEARCH_DATATYPE.includes(column.type.toLowerCase()))
          );
        })
        .map((column: any) => {
          return {
            id: column.name,
            label: column.name,
            value: column.name,
            subText: column.type,
          };
        });
    } else {
      return [];
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
        label: <Option label={option?.label} />,
        key: option?.id,
      };
    }
  }, [selectedValue, options]);

  return {
    options,
    onSelect,
    onClear,
    selected,
  };
}
