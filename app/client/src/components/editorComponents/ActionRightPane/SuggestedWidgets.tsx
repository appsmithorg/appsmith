import { getTypographyByKey } from "constants/DefaultTheme";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
import { Collapsible } from ".";
import Tooltip from "components/ads/Tooltip";

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
`;

const WidgetOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;

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
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/table+1.svg",
  },
  [WidgetTypes.CHART_WIDGET]: {
    label: "chart-series-data-control",
    propertyName: "chartData",
    widgetName: "Chart",
  },
  [WidgetTypes.DROP_DOWN_WIDGET]: {
    label: "options",
    propertyName: "options",
    widgetName: "Select",
    image:
      "https://s3.us-east-2.amazonaws.com/assets.appsmith.com/widgetSuggestion/Dropdown.svg",
  },
  [WidgetTypes.TEXT_WIDGET]: {
    label: "text",
    propertyName: "text",
    widgetName: "Text",
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
      return {
        type: widgetType,
        props: {
          [fieldName]: {
            [generateReactKey()]: {
              seriesName: "Sales",
              data: `{{${actionName}.data}}`,
            },
          },
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
  suggestedWidget: WidgetType;
};

function SuggestedWidgets(props: SuggestedWidgetProps) {
  const dispatch = useDispatch();
  const widgetInfo: WidgetBindingInfo | undefined =
    WIDGET_DATA_FIELD_MAP[props.suggestedWidget];

  if (!widgetInfo) return null;

  const addWidget = () => {
    const payload = getWidgetProps(
      props.suggestedWidget,
      widgetInfo,
      props.actionName,
    );

    dispatch({
      type: "ADD_WIDGET",
      payload,
    });
  };

  return (
    <Collapsible label="Add New Widget">
      <div className="description">
        This will add a new widget to the canvas.{" "}
      </div>

      <WidgetList>
        <div className="widget" onClick={addWidget}>
          <div>{widgetInfo.widgetName} Widget</div>
          <Tooltip content="Add to canvas">
            <div className="image-wrapper">
              {widgetInfo.image && <img src={widgetInfo.image} />}
              <WidgetOverlay />
            </div>
          </Tooltip>
        </div>
      </WidgetList>
    </Collapsible>
  );
}

export default SuggestedWidgets;
