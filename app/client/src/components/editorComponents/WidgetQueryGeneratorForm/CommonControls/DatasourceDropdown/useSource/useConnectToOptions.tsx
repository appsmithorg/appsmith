import React, { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentActions,
  getCurrentPageWidgets,
  getPluginIdPackageNamesMap,
  getPlugins,
  getQueryModuleInstances,
} from "ee/selectors/entitiesSelector";
import WidgetFactory from "WidgetProvider/factory";
import { DatasourceImage, ImageWrapper } from "../../../styles";
import { getDatatype } from "utils/AppsmithUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { DropdownOptionType } from "../../../types";
import type { WidgetProps } from "widgets/BaseWidget";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { PluginPackageName } from "entities/Action";
import type {
  ActionData,
  ActionDataState,
} from "ee/reducers/entityReducers/actionsReducer";
import type {
  ModuleInstanceData,
  ModuleInstanceDataState,
} from "ee/constants/ModuleInstanceConstants";
import type { Module } from "ee/constants/ModuleConstants";
import { getAllModules } from "ee/selectors/modulesSelector";
import { getModuleIcon } from "pages/Editor/utils";
import { isDynamicValue } from "@shared/dsl";

enum SortingWeights {
  alphabetical = 1,
  execution,
  datatype,
}

const SORT_INCREAMENT = 1;

export function sortQueries(
  queries: ActionDataState | ModuleInstanceDataState,
  expectedDatatype: string,
) {
  return queries.sort((A, B) => {
    const score = {
      A: 0,
      B: 0,
    };

    if (A.config.name < B.config.name) {
      score.A += SORT_INCREAMENT << SortingWeights.alphabetical;
    } else {
      score.B += SORT_INCREAMENT << SortingWeights.alphabetical;
    }

    if (A.data?.request?.requestedAt && B.data?.request?.requestedAt) {
      if (A.data.request.requestedAt > B.data.request.requestedAt) {
        score.A += SORT_INCREAMENT << SortingWeights.execution;
      } else {
        score.B += SORT_INCREAMENT << SortingWeights.execution;
      }
    } else if (A.data?.request?.requestedAt) {
      score.A += SORT_INCREAMENT << SortingWeights.execution;
    } else if (B.data?.request?.requestedAt) {
      score.B += SORT_INCREAMENT << SortingWeights.execution;
    }

    if (getDatatype(A.data?.body) === expectedDatatype) {
      score.A += SORT_INCREAMENT << SortingWeights.datatype;
    }

    if (getDatatype(B.data?.body) === expectedDatatype) {
      score.B += SORT_INCREAMENT << SortingWeights.datatype;
    }

    return score.A > score.B ? -1 : 1;
  });
}

export function getBindingValue(
  widget: WidgetProps,
  query: ActionData | ModuleInstanceData,
  getQueryBindingValue: (query: ActionData | ModuleInstanceData) => string = (
    query,
  ) => `{{${query.config.name}.data}}`,
) {
  const querySuggestedWidgets = query.data?.suggestedWidgets;

  if (!querySuggestedWidgets) return getQueryBindingValue(query);

  const suggestedWidget = querySuggestedWidgets.find(
    (suggestedWidget) => suggestedWidget.type === widget.type,
  );

  if (!suggestedWidget) return getQueryBindingValue(query);

  return `{{${query.config.name}.${suggestedWidget.bindingQuery}}}`;
}
interface ConnectToOptionsProps {
  pluginImages: Record<string, string>;
  widget: WidgetProps;
}

export const getQueryIcon = (
  query: ActionData | ModuleInstanceData,
  pluginImages: Record<string, string>,
  modules: Record<string, Module>,
) => {
  if (query.config.hasOwnProperty("type")) {
    const q = query as ModuleInstanceData;
    const module = modules[q.config.sourceModuleId];

    return getModuleIcon(module, pluginImages);
  } else {
    const action = query as ActionData;

    return (
      <ImageWrapper>
        <DatasourceImage
          alt=""
          className="dataSourceImage"
          src={pluginImages[action.config.pluginId]}
        />
      </ImageWrapper>
    );
  }
};

export const getAnalyticsInfo = (
  query: ActionData | ModuleInstanceData,
  widget: WidgetProps,
  propertyName: string,
) => {
  if (query.config.hasOwnProperty("pluginId")) {
    const action = query as ActionData;

    return {
      widgetName: widget.widgetName,
      widgetType: widget.type,
      propertyName: propertyName,
      entityBound: "Query",
      entityName: action.config.name,
      pluginType: action.config.pluginType,
    };
  }

  if (query.config.hasOwnProperty("sourceModuleId")) {
    return {
      widgetName: widget.widgetName,
      widgetType: widget.type,
      propertyName: propertyName,
      entityBound: "QueryModuleInstance",
      entityName: query.config.name,
      pluginType: "",
    };
  }
};

/*
 * useConnectToOptions hook - this returns the dropdown options to connect to a query or a connectable widget.
 *  */
function useConnectToOptions(props: ConnectToOptionsProps) {
  const {
    addBinding,
    allowedDatasourceTypes,
    expectedType,
    getQueryBindingValue,
    isConnectableToWidget,
    propertyName,
    updateConfig,
  } = useContext(WidgetQueryGeneratorFormContext);

  const queries = useSelector(getCurrentActions);
  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);
  const plugins = useSelector(getPlugins);

  const { pluginImages, widget } = props;

  const queryModuleInstances = useSelector(getQueryModuleInstances);
  const modules = useSelector(getAllModules);
  let filteredQueries: ActionData[] | ModuleInstanceData[] = queries;

  /* Exclude Gsheets from query options till this gets resolved https://github.com/appsmithorg/appsmith/issues/27102*/
  if (widget.type === "JSON_FORM_WIDGET") {
    filteredQueries = queries.filter((query) => {
      return (
        pluginsPackageNamesMap[query.config.pluginId] !==
        PluginPackageName.GOOGLE_SHEETS
      );
    });
  }

  // filter query based on allowedDatasourceType
  if (allowedDatasourceTypes) {
    const plugin = plugins.find((plugin) =>
      allowedDatasourceTypes.includes(plugin.name),
    );

    if (plugin) {
      filteredQueries = filteredQueries.filter(
        (query) => query.config.pluginId === plugin.id,
      );
    }
  }

  filteredQueries = [...filteredQueries, ...queryModuleInstances] as
    | ActionDataState
    | ModuleInstanceDataState;

  const queryOptions = useMemo(() => {
    return sortQueries(filteredQueries, expectedType).map((query) => ({
      id: query.config.id,
      label: query.config.name,
      value: getBindingValue(widget, query, getQueryBindingValue),
      icon: getQueryIcon(query, pluginImages, modules),
      onSelect: function (value: string, valueOption?: DropdownOptionType) {
        const isDynamic = isDynamicValue(value);

        addBinding(valueOption?.value, isDynamic);

        updateConfig({
          datasource: "",
          datasourcePluginType: "",
          datasourcePluginName: "",
          datasourceConnectionMode: "",
        });

        AnalyticsUtil.logEvent(
          "BIND_EXISTING_DATA_TO_WIDGET",
          getAnalyticsInfo(query, widget, propertyName),
        );
      },
    }));
  }, [filteredQueries, pluginImages, addBinding, widget]);

  const currentPageWidgets = useSelector(getCurrentPageWidgets);

  const widgetOptions = useMemo(() => {
    if (!isConnectableToWidget) return [];

    // Get widgets from the current page
    return Object.entries(currentPageWidgets)
      .map(([widgetId, currWidget]) => {
        // Get the widget config for the current widget
        const { getOneClickBindingConnectableWidgetConfig } =
          WidgetFactory.getWidgetMethods(currWidget.type);

        // If the widget is connectable to the current widget, return the option
        if (getOneClickBindingConnectableWidgetConfig) {
          // This is the path we bind to the sourceData field Ex: `{{Table1.selectedRow}}`
          const { widgetBindPath } =
            getOneClickBindingConnectableWidgetConfig(currWidget);
          const iconSVG =
            WidgetFactory.getConfig(currWidget.type)?.iconSVG ||
            currWidget.iconSVG;

          return {
            id: widgetId,
            value: `{{${widgetBindPath}}}`,
            label: currWidget.widgetName,
            icon: (
              <ImageWrapper>
                <DatasourceImage
                  alt="widget-icon"
                  className="dataSourceImage"
                  src={iconSVG}
                />
              </ImageWrapper>
            ),
            onSelect: function (
              value?: string,
              valueOption?: DropdownOptionType,
            ) {
              addBinding(valueOption?.value, false);
              updateConfig({
                datasource: "",
                datasourcePluginType: "",
                datasourcePluginName: "",
                datasourceConnectionMode: "",
              });

              AnalyticsUtil.logEvent("BIND_EXISTING_DATA_TO_WIDGET", {
                widgetName: widget.widgetName,
                widgetType: widget.type,
                propertyName: propertyName,
                entityBound: "Widget",
                entityName: currWidget.widgetName,
                pluginType: "",
              });
            },
          };
        }

        return null;
      })
      .filter(Boolean);
  }, [currentPageWidgets, addBinding, isConnectableToWidget]);

  return { queryOptions, widgetOptions };
}

export default useConnectToOptions;
