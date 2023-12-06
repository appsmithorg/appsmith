import {
  DatasourceImage,
  ImageWrapper,
} from "components/editorComponents/WidgetQueryGeneratorForm/styles";
import {
  getBindingValue,
  sortQueries,
} from "components/editorComponents/WidgetQueryGeneratorForm/CommonControls/DatasourceDropdown/useSource/useConnectToOptions";
import type { DropdownOptionType } from "components/editorComponents/WidgetQueryGeneratorForm/types";
import React from "react";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { ActionDataState } from "@appsmith/reducers/entityReducers/actionsReducer";
import type { WidgetProps } from "widgets/BaseWidget";

export const getSortedQueries = (
  pluginImages: Record<string, string>,
  addBinding: (binding?: string, makeDynamicPropertyPath?: boolean) => void,
  updateConfig: (
    property: string | Record<string, unknown>,
    value?: unknown,
  ) => void,
  widget: WidgetProps,
  propertyName: string,
  expectedType: string,
  filteredQueries: ActionDataState,
) => {
  const sortedQueries = sortQueries(filteredQueries, expectedType).map(
    (query) => ({
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
    }),
  );
  return sortedQueries;
};
