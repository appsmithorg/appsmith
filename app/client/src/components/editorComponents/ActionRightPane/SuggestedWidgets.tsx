import { getTypographyByKey } from "constants/DefaultTheme";
import { WidgetType, WidgetTypes } from "constants/WidgetConstants";
import React from "react";
import { useDispatch } from "react-redux";
import styled from "styled-components";
import { generateReactKey } from "utils/generators";
import { Collapsible } from ".";
import Button, { Category, Size } from "../../ads/Button";
import { Variant } from "../../ads/common";
import { bindDataOnCanvas } from "../../../actions/actionActions";
import { useParams } from "react-router";
import { ExplorerURLParams } from "../../../pages/Editor/Explorer/helpers";

const WidgetList = styled.div`
  ${(props) => getTypographyByKey(props, "p1")}
  margin-left: ${(props) => props.theme.spaces[2] + 1}px;

  .image {
    width: 100%;
    height: 40px;
    background-color: #f0f0f0;
  }

  .widget:hover {
    cursor: pointer;
  }
`;

type WidgetBindingInfo = {
  label: string;
  propertyName: string;
  widgetName: string;
};

export const WIDGET_DATA_FIELD_MAP: Record<string, WidgetBindingInfo> = {
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

  const { applicationId, pageId } = useParams<ExplorerURLParams>();
  const params = useParams<{ apiId?: string; queryId?: string }>();

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

  const handleBindData = () => {
    dispatch(
      bindDataOnCanvas({
        queryId: (params.apiId || params.queryId) as string,
        applicationId,
        pageId,
      }),
    );
  };

  return (
    <>
      <Collapsible label="Add New Widget">
        <div className="description">
          This will add a new widget to the canvas.{" "}
        </div>

        <WidgetList>
          <div className="widget" onClick={addWidget}>
            <div>{widgetInfo.widgetName} Widget</div>
            <div className="image" />
          </div>
        </WidgetList>
      </Collapsible>
      <Collapsible label="Select Existing Widgets">
        <div className="description">Go to canvas and select widgets</div>
        <WidgetList>
          <Button
            category={Category.tertiary}
            onClick={handleBindData}
            size={Size.medium}
            tag="button"
            text="Select In Canvas"
            type="button"
            variant={Variant.info}
          />
        </WidgetList>
      </Collapsible>
    </>
  );
}

export default SuggestedWidgets;
