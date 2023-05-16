import React from "react";
import { fetchGheetSheets } from "actions/datasourceActions";
import { Colors } from "constants/Colors";
import { IconSize } from "design-system-old";
import { PluginPackageName } from "entities/Action";
import { useCallback, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getDatasource,
  getDatasourceLoading,
  getDatasourceStructureById,
  getIsFetchingDatasourceStructure,
  getPluginPackageFromDatasourceId,
} from "selectors/entitiesSelector";
import { WidgetQueryGeneratorFormContext } from "../..";
import { Bold, Label } from "../../styles";
import { PluginFormInputFieldMap } from "../../constants";
import {
  getGsheetSpreadsheets,
  getIsFetchingGsheetSpreadsheets,
} from "selectors/datasourceSelectors";
import type { AppState } from "ce/reducers";
import { Icon } from "ddesign-system";
import { DropdownOption as Option } from "../DatasourceDropdown/DropdownOption";
import type { DropdownOptionType } from "../../types";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";

export function useTableOrSpreadsheet() {
  const dispatch = useDispatch();

  const { config, updateConfig, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const datasourceStructure = useSelector(
    getDatasourceStructureById(config.datasource),
  );

  const isDatasourceLoading = useSelector(getDatasourceLoading);

  const spreadSheets = useSelector(getGsheetSpreadsheets(config.datasource));

  const isFetchingSpreadsheets = useSelector(getIsFetchingGsheetSpreadsheets);

  const isFetchingDatasourceStructure = useSelector(
    getIsFetchingDatasourceStructure,
  );

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  const selectedDatasource = useSelector((state: AppState) =>
    getDatasource(state, config.datasource),
  );

  const fieldName: string = selectedDatasourcePluginPackageName
    ? (
        PluginFormInputFieldMap[selectedDatasourcePluginPackageName] ||
        PluginFormInputFieldMap.DEFAULT
      ).TABLE
    : "table";

  const options = useMemo(() => {
    if (
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      spreadSheets
    ) {
      return (spreadSheets.value || []).map(({ label, value }) => ({
        id: value,
        label: label,
        value: value,
        icon: <Icon color={Colors.GRAY} name="tables" size={IconSize.XXL} />,
      }));
    } else if (datasourceStructure) {
      return (datasourceStructure.tables || []).map(({ name }) => ({
        id: name,
        label: name,
        value: name,
        icon: <Icon color={Colors.GRAY} name="tables" size={IconSize.XXL} />,
      }));
    } else {
      return [];
    }
  }, [selectedDatasourcePluginPackageName, spreadSheets, datasourceStructure]);

  const onSelect = useCallback(
    (table: string | undefined, TableObj: DropdownOptionType) => {
      updateConfig("table", TableObj.value);

      if (
        selectedDatasourcePluginPackageName ===
          PluginPackageName.GOOGLE_SHEETS &&
        selectedDatasource?.pluginId
      ) {
        dispatch(
          fetchGheetSheets({
            datasourceId: config.datasource,
            pluginId: selectedDatasource?.pluginId,
            sheetUrl: TableObj.value || "",
          }),
        );
      }
    },
    [
      updateConfig,
      selectedDatasourcePluginPackageName,
      config,
      dispatch,
      selectedDatasource,
    ],
  );

  const selected = useMemo(() => {
    if (config.table) {
      const option = options.find((option) => option.value === config.table);

      return {
        label: <Option label={option?.label} leftIcon={option?.icon} />,
        key: option?.id,
      };
    }
  }, [config.table, options]);

  const isConnecting = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  return {
    error:
      selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS
        ? spreadSheets?.error
        : datasourceStructure?.error?.message,
    label: (
      <Label>
        Select {fieldName} from <Bold>{selectedDatasource?.name}</Bold>
      </Label>
    ),
    options,
    isLoading:
      isFetchingSpreadsheets ||
      isFetchingDatasourceStructure ||
      isDatasourceLoading,
    onSelect,
    selected,
    show: !!config.datasource,
    disabled: isConnecting,
  };
}
