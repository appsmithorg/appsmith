import React, { useContext, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  getActionsForCurrentPage,
  getCurrentPageWidgets,
} from "selectors/entitiesSelector";
import WidgetFactory from "WidgetProvider/factory";
import type { ActionDataState } from "reducers/entityReducers/actionsReducer";
import { DatasourceImage, ImageWrapper } from "../../../styles";
import { getDatatype } from "utils/AppsmithUtils";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { DropdownOptionType } from "../../../types";
import type { WidgetProps } from "widgets/BaseWidget";
import { WidgetQueryGeneratorFormContext } from "components/editorComponents/WidgetQueryGeneratorForm";

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
  pluginImages: Record<string, string>;
  widget: WidgetProps;
}

function useQueryOptions(props: ConnectToOptionsProps) {
  const {
    addBinding,
    expectedType,
    isConnectableToWidget,
    propertyName,
    updateConfig,
  } = useContext(WidgetQueryGeneratorFormContext);

  const queries = useSelector(getActionsForCurrentPage);
  const { pluginImages, widget } = props;

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
      .map(([widgetId, currWidget]) => {
        const { getOneClickBindingConnectableWidgetConfig } =
          WidgetFactory.getWidgetMethods(currWidget.type);
        if (getOneClickBindingConnectableWidgetConfig) {
          const widgetBindPath =
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
