import { getTypographyByKey } from "constants/DefaultTheme";
import { WidgetTypes } from "constants/WidgetConstants";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
import { Collapsible } from ".";

const WidgetList = styled.div`
  ${(props) => getTypographyByKey(props, "p1")}
  margin-left: 7px;

  .image {
    width: 100%;
    height: 40px;
    background-color: #f0f0f0;
  }

  .widget:hover {
    cursor: pointer;
  }

  .widget:not(:first-child) {
    margin-top: 24px;
  }
`;

export const WIDGET_DATA_FIELD_MAP: Record<string, Record<string, string>> = {
  [WidgetTypes.LIST_WIDGET]: {
    label: "items",
    propertyName: "listData",
    widgetName: "List",
  },
  [WidgetTypes.TABLE_WIDGET]: {
    label: "tabledata",
    propertyName: "tableData",
    widgetName: "Table",
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
  },
  [WidgetTypes.TEXT_WIDGET]: {
    label: "text",
    propertyName: "text",
    widgetName: "Text",
  },
};

function SuggestedWidgets(props: any) {
  const dispatch = useDispatch();

  const onClick = (type: string) => {
    const fieldName = WIDGET_DATA_FIELD_MAP[type].propertyName;
    const payload =
      type === WidgetTypes.CHART_WIDGET
        ? {
            [fieldName]: {
              [generateReactKey()]: {
                seriesName: "Sales",
                data: `{{${props.actionName}.data.}}`,
              },
            },
          }
        : {
            [fieldName]: `{{${props.actionName}.data.}}`,
          };

    dispatch({
      type: "ADD_WIDGET",
      payload: {
        type: type,
        props: payload,
      },
    });
  };

  return (
    <Collapsible label="Add New Widget">
      <div className="description">
        This will add a new widget to the canvas.{" "}
      </div>

      <WidgetList>
        {Object.entries(WIDGET_DATA_FIELD_MAP).map((value) => {
          return (
            <div
              className="widget"
              key={value[0]}
              onClick={() => onClick(value[0])}
            >
              <div>{value[1].widgetName} Widget</div>
              <div className="image" />
            </div>
          );
        })}
      </WidgetList>
    </Collapsible>
  );
}

export default SuggestedWidgets;
