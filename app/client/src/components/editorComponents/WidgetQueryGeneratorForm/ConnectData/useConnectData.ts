import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import { PluginPackageName } from "entities/Action";
import { useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";
import { getPluginPackageFromDatasourceId } from "selectors/entitiesSelector";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { WidgetQueryGeneratorFormContext } from "..";
import { isValidGsheetConfig } from "../utils";
import { useColumns } from "../WidgetSpecificControls/ColumnDropdown/useColumns";

export function useConnectData() {
  const dispatch = useDispatch();

  const { config, propertyName, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const { columns, primaryColumn } = useColumns("");

  const isLoading = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  const onClick = () => {
    const payload = {
      tableName: config.table,
      sheetName: config.sheet,
      datasourceId: config.datasource,
      widgetId: widgetId,
      tableHeaderIndex: config.tableHeaderIndex,
      searchableColumn: config.searchableColumn,
      columns: columns.map((column) => column.name),
      primaryColumn,
    };

    dispatch({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      payload,
    });

    AnalyticsUtil.logEvent(`GENERATE_QUERY_CONNECT_DATA_CLICK`, {
      widgetName: widget.widgetName,
      widgetType: widget.type,
      propertyName: propertyName,
      pluginType: config.datasourcePluginType,
      pluginName: config.datasourcePluginName,
      additionalData: {
        dataTableName: config.table,
        searchableColumn: config.searchableColumn,
      },
    });
  };

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  const show = !!config.datasource;

  const disabled =
    !config.table ||
    (selectedDatasourcePluginPackageName === PluginPackageName.GOOGLE_SHEETS &&
      !isValidGsheetConfig(config));

  return {
    show,
    disabled,
    onClick,
    isLoading,
  };
}
