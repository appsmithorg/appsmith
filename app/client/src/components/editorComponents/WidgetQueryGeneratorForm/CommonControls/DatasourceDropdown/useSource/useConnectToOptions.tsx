import React, { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getCurrentActions,
  getCurrentPageWidgets,
  getPluginIdPackageNamesMap,
} from "@appsmith/selectors/entitiesSelector";
import WidgetFactory from "WidgetProvider/factory";
import { DatasourceImage, ImageWrapper } from "../../../styles";
import { getDatatype } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { DropdownOptionType } from "../../../types";
import type { WidgetProps } from "widgets/BaseWidget";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";
import { PluginPackageName } from "entities/Action";
import type {
  ActionData,
  ActionDataState,
} from "@appsmith/reducers/entityReducers/actionsReducer";

enum SortingWeights {
  alphabetical = 1,
  execution,
  datatype,
}

const SORT_INCREAMENT = 1;

function sortQueries(queries: ActionDataState, expectedDatatype: string) {
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

function getBindingValue(widget: WidgetProps, query: ActionData) {
  const defaultBindingValue = `{{${query.config.name}.data}}`;
  const querySuggestedWidgets = query.data?.suggestedWidgets;
  if (!querySuggestedWidgets) return defaultBindingValue;
  const suggestedWidget = querySuggestedWidgets.find(
    (suggestedWidget) => suggestedWidget.type === widget.type,
  );
  if (!suggestedWidget) return defaultBindingValue;
  return `{{${query.config.name}.${suggestedWidget.bindingQuery}}}`;
}
interface ConnectToOptionsProps {
  pluginImages: Record<string, string>;
  widget: WidgetProps;
}

/*
 * useConnectToOptions hook - this returns the dropdown options to connect to a query or a connectable widget.
 *  */
function useConnectToOptions(props: ConnectToOptionsProps) {
  const {
    addBinding,
    expectedType,
    isConnectableToWidget,
    propertyName,
    updateConfig,
  } = useContext(WidgetQueryGeneratorFormContext);

  const queries = useSelector(getCurrentActions);
  const pluginsPackageNamesMap = useSelector(getPluginIdPackageNamesMap);

  const { pluginImages, widget } = props;

  let filteredQueries = queries;
  /* Exclude Gsheets from query options till this gets resolved https://github.com/appsmithorg/appsmith/issues/27102*/
  if (widget.type === "JSON_FORM_WIDGET") {
    filteredQueries = queries.filter((query) => {
      return (
        pluginsPackageNamesMap[query.config.pluginId] !==
        PluginPackageName.GOOGLE_SHEETS
      );
    });
  }

  const queryOptions = useMemo(() => {
    return sortQueries(filteredQueries, expectedType).map((query) => ({
      id: query.config.id,
      label: query.config.name,
      value: getBindingValue(widget, query),
      icon: (
        <ImageWrapper>
          <DatasourceImage
            alt=""
            className="dataSourceImage"
            src={pluginImages[query.config.pluginId]}
          />
        </ImageWrapper>
      ),
      onSelect: function (value?: string, valueOption?: DropdownOptionType) {
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
          entityBound: "Query",
          entityName: query.config.name,
          pluginType: query.config.pluginType,
        });
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
          return {
            id: widgetId,
            value: `{{${widgetBindPath}}}`,
            label: currWidget.widgetName,
            icon: (
              <ImageWrapper>
                <DatasourceImage
                  alt="widget-icon"
                  className="dataSourceImage"
                  src={currWidget.iconSVG}
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
