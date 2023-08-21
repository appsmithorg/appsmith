import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { AppState } from "@appsmith/reducers";
import { PluginPackageName } from "entities/Action";
import { useContext, useMemo } from "react";
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

  const { aliases, config, propertyName, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const widget = useSelector((state: AppState) => getWidget(state, widgetId));

  const { columns, primaryColumn } = useColumns("", false);

  const isLoading = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  const onClick = () => {
    const searchableColumn = (() => {
      if (config.searchableColumn) {
        return config.searchableColumn;
      } else {
        const alias = aliases?.find((d) => d.isSearcheable)?.name;

        return alias && config.alias[alias];
      }
    })();

    const payload = {
      tableName: config.table,
      sheetName: config.sheet,
      datasourceId: config.datasource,
      widgetId: widgetId,
      tableHeaderIndex: config.tableHeaderIndex,
      searchableColumn,
      columns: columns.map((column) => column.name),
      primaryColumn,
      connectionMode: config.datasourceConnectionMode,
      aliases: Object.entries(config.alias).map(([key, value]) => ({
        name: key,
        alias: value,
      })),
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
      connectionMode: config.datasourceConnectionMode,
      additionalData: {
        dataTableName: config.table,
        searchableColumn: config.searchableColumn,
        alias: config.alias,
      },
    });
  };

  const selectedDatasourcePluginPackageName = useSelector((state: AppState) =>
    getPluginPackageFromDatasourceId(state, config.datasource),
  );

  const show = !!config.datasource;

  const disabled = useMemo(() => {
    return (
      !config.table ||
      (selectedDatasourcePluginPackageName ===
        PluginPackageName.GOOGLE_SHEETS &&
        !isValidGsheetConfig(config)) ||
      aliases?.some((alias) => {
        return alias.isRequired && !config.alias[alias.name];
      })
    );
  }, [config, aliases]);

  return {
    show,
    disabled,
    onClick,
    isLoading,
  };
}
