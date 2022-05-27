import React from "react";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import {
  getWidgetEvalValues,
  getIsWidgetLoading,
} from "selectors/dataTreeSelectors";
import {
  getMainCanvasProps,
  computeMainContainerWidget,
  createCanvasWidget,
} from "selectors/editorSelectors";
import { getCanvasWidget } from "selectors/entitiesSelector";
import BaseWidget, { WidgetProps } from "./BaseWidget";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import { CanvasWidgetStructure } from "./constants";

function withWidgetProps(WrappedWidget: typeof BaseWidget) {
  function WrappedComponent(props: CanvasWidgetStructure) {
    const { children, widgetId, widgetName } = props;

    const canvasWidget = useSelector((state: AppState) =>
      getCanvasWidget(state, widgetId),
    );
    const mainCanvasProps = useSelector((state: AppState) =>
      getMainCanvasProps(state),
    );
    const evaluatedWidget = useSelector((state: AppState) =>
      getWidgetEvalValues(state, widgetName),
    );
    const isLoading = useSelector((state: AppState) =>
      getIsWidgetLoading(state, widgetName),
    );

    const canvasWidgetProps =
      widgetId === MAIN_CONTAINER_WIDGET_ID
        ? computeMainContainerWidget(canvasWidget, mainCanvasProps)
        : canvasWidget;

    const widgetProps: WidgetProps = createCanvasWidget(
      canvasWidgetProps,
      evaluatedWidget,
    );

    widgetProps.isLoading = isLoading;

    widgetProps.children = children;

    return <WrappedWidget {...props} {...widgetProps} />;
  }

  WrappedComponent.getMetaPropertiesMap = WrappedWidget.getMetaPropertiesMap;
  WrappedComponent.getDefaultPropertiesMap =
    WrappedWidget.getDefaultPropertiesMap;

  return WrappedComponent;
}

export default withWidgetProps;
