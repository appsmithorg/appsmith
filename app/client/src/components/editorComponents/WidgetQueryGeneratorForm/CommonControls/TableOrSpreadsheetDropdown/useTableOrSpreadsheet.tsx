import React from "react";
import { fetchGheetSheets } from "actions/datasourceActions";
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
import { isGoogleSheetPluginDS } from "utils/editorContextUtils";
import type { AppState } from "@appsmith/reducers";
import { Icon } from "design-system";
import { DropdownOption as Option } from "../DatasourceDropdown/DropdownOption";
import type { DropdownOptionType } from "../../types";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { getWidget } from "sagas/selectors";
import type { DatasourceStructure } from "entities/Datasource";

export function useTableOrSpreadsheet() {
  const dispatch = useDispatch();

  const { config, propertyName, updateConfig, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const datasourceStructure: DatasourceStructure = useSelector((state) =>
    getDatasourceStructureById(state, config.datasource),
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
      isGoogleSheetPluginDS(selectedDatasourcePluginPackageName) &&
      spreadSheets
    ) {
      return (spreadSheets.value || []).map(({ label, value }) => ({
        id: value,
        label: label,
        value: value,
        icon: (
          <Icon
            color="var(--ads-v2-color-fg)"
            name="layout-left-2-line"
            size="md"
          />
        ),
      }));
    } else if (datasourceStructure) {
      return (datasourceStructure.tables || []).map(({ name }) => ({
        id: name,
        label: name,
        value: name,
        icon: (
          <Icon
            color="var(--ads-v2-color-fg)"
            name="layout-left-2-line"
            size="md"
          />
        ),
      }));
    } else {
      return [];
    }
  }, [selectedDatasourcePluginPackageName, spreadSheets, datasourceStructure]);

  const onSelect = useCallback(
    (table: string | undefined, TableObj: DropdownOptionType) => {
      updateConfig("table", TableObj.value);

      if (
        isGoogleSheetPluginDS(selectedDatasourcePluginPackageName) &&
        selectedDatasource?.pluginId
      ) {
        dispatch(
          fetchGheetSheets({
            datasourceId: config.datasource,
            pluginId: selectedDatasource.pluginId,
            sheetUrl: TableObj.value || "",
          }),
        );
      }

      AnalyticsUtil.logEvent("GENERATE_QUERY_SELECT_DATA_TABLE", {
        widgetName: widget.widgetName,
        widgetType: widget.type,
        propertyName: propertyName,
        dataTableName: TableObj.value,
        pluginType: config.datasourcePluginType,
        pluginName: config.datasourcePluginName,
      });
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
    error: isGoogleSheetPluginDS(selectedDatasourcePluginPackageName)
      ? spreadSheets?.error
      : datasourceStructure?.error?.message,
    labelText: `Select ${fieldName} from ${selectedDatasource?.name}`,
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
