import { useDispatch, useSelector } from "react-redux";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { getWidget } from "sagas/selectors";
import { getPluginPackageFromDatasourceId } from "ee/selectors/entitiesSelector";
import { getisOneClickBindingConnectingForWidget } from "selectors/oneClickBindingSelectors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { isValidGsheetConfig } from "../utils";
import { useContext, useMemo } from "react";
import { WidgetQueryGeneratorFormContext } from "../index";
import { PluginPackageName } from "../../../../entities/Action";
import { useFormConfig } from "../common/useFormConfig";

export function useConnectData() {
  const dispatch = useDispatch();

  const { aliases, config, otherFields, propertyName, widgetId } = useContext(
    WidgetQueryGeneratorFormContext,
  );

  const widget = useSelector((state) => getWidget(state, widgetId));

  const formConfig = useFormConfig();

  const isLoading = useSelector(
    getisOneClickBindingConnectingForWidget(widgetId),
  );

  const onClick = () => {
    dispatch({
      type: ReduxActionTypes.BIND_WIDGET_TO_DATASOURCE,
      payload: formConfig, // Use the formConfig payload directly
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
        formType: config.otherFields?.formType,
      },
    });
  };

  const selectedDatasourcePluginPackageName = useSelector((state) =>
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
      }) ||
      (otherFields &&
        otherFields?.some((field) => {
          return (
            field.isRequired &&
            field.isVisible?.(config) &&
            !config.otherFields?.[field.name]
          );
        }))
    );
  }, [config, aliases]);

  return {
    show,
    disabled,
    onClick,
    isLoading,
  };
}
