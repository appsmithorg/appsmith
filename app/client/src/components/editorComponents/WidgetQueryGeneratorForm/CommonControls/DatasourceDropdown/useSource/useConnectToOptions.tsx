import { useSelector } from "react-redux";
import {
  getActionsForCurrentPage,
  getCurrentPageWidgets,
} from "selectors/entitiesSelector";
import React, { useMemo } from "react";
import WidgetFactory from "utils/WidgetFactory";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { DatasourceImage, ImageWrapper } from "../../../styles";
import { getDatatype } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { DropdownOptionType } from "../../../types";
import type { WidgetProps } from "widgets/BaseWidget";

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

interface ConnectToOptionsProps {
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void;
  expectedType: string;
  pluginImages: Record<string, string>;
  updateConfig: (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => void;
  widget: WidgetProps;
  propertyName: string;
  isConnectableToWidget?: boolean;
}

function useQueryOptions(props: ConnectToOptionsProps) {
  const queries = useSelector(getActionsForCurrentPage);
  const {
    addBinding,
    expectedType,
    isConnectableToWidget,
    pluginImages,
    propertyName,
    updateConfig,
    widget,
  } = props;

  const queryOptions = useMemo(() => {
    return sortQueries(queries, expectedType).map((query) => ({
      id: query.config.id,
      label: query.config.name,
      value: `{{${query.config.name}.data}}`,
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

        AnalyticsUtil.logEvent("BIND_EXISTING_QUERY_TO_WIDGET", {
          widgetName: widget.widgetName,
          widgetType: widget.type,
          propertyName: propertyName,
          queryName: query.config.name,
          pluginType: query.config.pluginType,
        });
      },
    }));
  }, [queries, pluginImages, addBinding]);

  const currentPageWidgets = useSelector(getCurrentPageWidgets);

  const widgetOptions = useMemo(() => {
    if (!isConnectableToWidget) return [];
    return Object.entries(currentPageWidgets)
      .map(([widgetId, widget]) => {
        const { getOneClickBindingConnectableWidgetConfig } =
          WidgetFactory.getWidgetMethods(widget.type);
        if (getOneClickBindingConnectableWidgetConfig) {
          const widgetBindPath =
            getOneClickBindingConnectableWidgetConfig(widget);
          return {
            id: widgetId,
            value: `{{${widgetBindPath}}}`,
            label: widget.widgetName,
            icon: (
              <ImageWrapper>
                <DatasourceImage
                  alt="widget-icon"
                  className="dataSourceImage"
                  src={widget.iconSVG}
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

              // TODO (Sangeeth) : Check with team for analytics event
            },
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [currentPageWidgets, addBinding, isConnectableToWidget]);

  return { queryOptions, widgetOptions };
}

export default useQueryOptions;
