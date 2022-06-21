import equal from "fast-deep-equal/es6";
import React from "react";

import BaseWidget, { WidgetProps } from "./BaseWidget";
import { MAIN_CONTAINER_WIDGET_ID } from "constants/WidgetConstants";
import {
  getWidgetEvalValues,
  getIsWidgetLoading,
} from "selectors/dataTreeSelectors";
import {
  getMainCanvasProps,
  computeMainContainerWidget,
  createCanvasWidget,
  getChildWidgets,
  createLoadingWidget,
} from "selectors/editorSelectors";
import { AppState } from "reducers";
import { CanvasWidgetStructure } from "./constants";
import { getCanvasWidget } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";

const WIDGETS_WITH_CHILD_WIDGETS = ["LIST_WIDGET", "FORM_WIDGET"];

function withWidgetProps(WrappedWidget: typeof BaseWidget) {
  function WrappedComponent(
    props: CanvasWidgetStructure & { skipWidgetPropsHydration?: boolean },
  ) {
    const {
      children,
      renderMode,
      skipWidgetPropsHydration,
      type,
      widgetId,
      widgetName,
    } = props;

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

    const childWidgets = useSelector((state: AppState) => {
      if (!WIDGETS_WITH_CHILD_WIDGETS.includes(type)) return undefined;

      return getChildWidgets(state, widgetId);
    }, equal);

    let widgetProps: WidgetProps | null = null;

    if (!skipWidgetPropsHydration) {
      const canvasWidgetProps =
        widgetId === MAIN_CONTAINER_WIDGET_ID
          ? computeMainContainerWidget(canvasWidget, mainCanvasProps)
          : canvasWidget;

      widgetProps = evaluatedWidget
        ? createCanvasWidget(canvasWidgetProps, evaluatedWidget)
        : createLoadingWidget(canvasWidgetProps);

      widgetProps.isVisible =
        widgetProps.isVisible ?? widgetProps.type !== "MODAL_WIDGET";

      if (
        widgetId !== MAIN_CONTAINER_WIDGET_ID &&
        props.type === "CANVAS_WIDGET"
      ) {
        widgetProps.rightColumn = props.rightColumn;
        widgetProps.bottomRow = props.bottomRow;
        widgetProps.minHeight = props.minHeight;
        // TODO: Add these
        // widgetProps.shouldScrollContents = props.shouldScrollContents;
        // widgetProps.canExtend = props.canExtend;
        widgetProps.parentId = props.parentId;
      } else {
        widgetProps.parentColumnSpace = props.parentColumnSpace;
        widgetProps.parentRowSpace = props.parentRowSpace;
        widgetProps.parentId = props.parentId;

        // Form Widget Props
        widgetProps.onReset = props.onReset;
        widgetProps.isFormValid = props.isFormValid;
      }

      widgetProps.children = children;

      widgetProps.isLoading = isLoading;
      widgetProps.childWidgets = childWidgets;
    }

    if (widgetProps) {
      widgetProps.renderMode = renderMode;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <WrappedWidget {...props} {...widgetProps} />;
  }

  WrappedComponent.getMetaPropertiesMap = WrappedWidget.getMetaPropertiesMap;
  WrappedComponent.getDefaultPropertiesMap =
    WrappedWidget.getDefaultPropertiesMap;

  return WrappedComponent;
}

export default withWidgetProps;
