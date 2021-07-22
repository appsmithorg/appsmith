import { getTypographyByKey } from "constants/DefaultTheme";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
import { Collapsible } from ".";
import Tooltip from "components/ads/Tooltip";
import { addSuggestedWidget } from "actions/widgetActions";
import AnalyticsUtil from "utils/AnalyticsUtil";

const WidgetList = styled.div`
  ${(props) => getTypographyByKey(props, "p1")}
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;

  img {
    max-width: 100%;
  }

  .image-wrapper {
    position: relative;
    margin-top: ${(props) => props.theme.spaces[1]}px;
  }

  .widget:hover {
    cursor: pointer;
  }

  .widget:not(:first-child) {
    margin-top: 24px;
  }
`;

const WidgetOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - ${(props) => props.theme.spaces[1]}px);

  &:hover {
    display: block;
    background: rgba(0, 0, 0, 0.6);
  }
`;

type WidgetBindingInfo = {
  label: string;
  propertyName: string;
  widgetName: string;
  image?: string;
};

export const WIDGET_DATA_FIELD_MAP: Record<string, WidgetBindingInfo> = {
  [WidgetTypes.LIST_WIDGET]: {
    label: "items",
    propertyName: "listData",
    widgetName: "List",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/list.svg",
  },
  [WidgetTypes.TABLE_WIDGET]: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/table.svg",
  },
  [WidgetTypes.CHART_WIDGET]: {
    label: "chart-series-data-control",
    propertyName: "chartData",
    widgetName: "Chart",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/chart.svg",
  },
  [WidgetTypes.DROP_DOWN_WIDGET]: {
    label: "options",
    propertyName: "options",
    widgetName: "Select",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/dropdown.svg",
  },
  [WidgetTypes.TEXT_WIDGET]: {
    label: "text",
    propertyName: "text",
    widgetName: "Text",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/text.svg",
  },
  [WidgetTypes.INPUT_WIDGET]: {
    label: "text",
    propertyName: "defaultText",
    widgetName: "Input",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/input.svg",
  },
};

function getWidgetProps(
  widgetType: WidgetType,
  widgetInfo: WidgetBindingInfo,
  actionName: string,
) {
  const fieldName = widgetInfo.propertyName;
  switch (widgetType) {
    case WidgetTypes.TABLE_WIDGET:
      return {
        type: WidgetTypes.TABLE_WIDGET,
        props: {
          [fieldName]: `{{${actionName}.data}}`,
          dynamicBindingPathList: [{ key: "tableData" }],
        },
        parentRowSpace: 10,
      };
    case WidgetTypes.CHART_WIDGET:
      const reactKey = generateReactKey();

      return {
        type: widgetType,
        props: {
          [fieldName]: {
            [reactKey]: {
              seriesName: "Sales",
              data: `{{${actionName}.data}}`,
            },
          },
          dynamicBindingPathList: [{ key: `chart.${reactKey}.data` }],
        },
      };
    default:
      return {
        type: widgetType,
        props: {
          [fieldName]: `{{${actionName}.data}}`,
          dynamicBindingPathList: [{ key: widgetInfo.propertyName }],
        },
      };
  }
}

type SuggestedWidgetProps = {
  actionName: string;
  suggestedWidgets: WidgetType[];
  hasWidgets: boolean;
};

function SuggestedWidgets(props: SuggestedWidgetProps) {
  const dispatch = useDispatch();

  const addWidget = (widgetType: WidgetType, widgetInfo: WidgetBindingInfo) => {
    const payload = getWidgetProps(widgetType, widgetInfo, props.actionName);

    AnalyticsUtil.logEvent("SUGGESTED_WIDGET_CLICK", {
      widget: widgetType,
    });

    dispatch(addSuggestedWidget(payload));
  };

  const label = props.hasWidgets ? "Add New Widget" : "Suggested widgets";

  return (
    <Collapsible label={label}>
      <div className="description">
        This will add a new widget to the canvas.
      </div>
      <WidgetList>
        {props.suggestedWidgets.map((widgetType) => {
          const widgetInfo: WidgetBindingInfo | undefined =
            WIDGET_DATA_FIELD_MAP[widgetType];

          if (!widgetInfo) return null;

          return (
            <div
              className={`widget t--suggested-widget-${widgetType}`}
              key={widgetType}
              onClick={() => addWidget(widgetType, widgetInfo)}
            >
              <Tooltip content="Add to canvas">
                <div className="image-wrapper">
                  {widgetInfo.image && <img src={widgetInfo.image} />}
                  <WidgetOverlay />
                </div>
              </Tooltip>
            </div>
          );
        })}
      </WidgetList>
    </Collapsible>
  );
}

export default SuggestedWidgets;
