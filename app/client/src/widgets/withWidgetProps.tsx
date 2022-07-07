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
  getRenderMode,
  getFormChildWidgets,
} from "selectors/editorSelectors";
import { AppState } from "reducers";
import { CanvasWidgetStructure } from "./constants";
import { getCanvasWidget } from "selectors/entitiesSelector";
import { useSelector } from "react-redux";

const WIDGETS_WITH_CHILD_WIDGETS = ["LIST_WIDGET", "FORM_WIDGET"];

function withWidgetProps(WrappedWidget: typeof BaseWidget) {
  function WrappedPropsComponent(
    props: CanvasWidgetStructure & { skipWidgetPropsHydration?: boolean },
  ) {
    const { children, skipWidgetPropsHydration, type, widgetId } = props;

    const canvasWidget = useSelector((state: AppState) =>
      getCanvasWidget(state, widgetId),
    );
    const mainCanvasProps = useSelector((state: AppState) =>
      getMainCanvasProps(state),
    );
    const renderMode = useSelector(getRenderMode);
    const evaluatedWidget = useSelector((state: AppState) =>
      getWidgetEvalValues(state, canvasWidget?.widgetName),
    );
    const isLoading = useSelector((state: AppState) =>
      getIsWidgetLoading(state, canvasWidget?.widgetName),
    );

    const childWidgets = useSelector((state: AppState) => {
      if (!WIDGETS_WITH_CHILD_WIDGETS.includes(type)) return undefined;

      if (type === "FORM_WIDGET") return getFormChildWidgets(state, widgetId);
      return getChildWidgets(state, widgetId);
    }, equal);

    let widgetProps: WidgetProps = {} as WidgetProps;

    if (!skipWidgetPropsHydration) {
      const canvasWidgetProps = (() => {
        if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
          return computeMainContainerWidget(canvasWidget, mainCanvasProps);
        }

        return evaluatedWidget
          ? createCanvasWidget(canvasWidget, evaluatedWidget)
          : createLoadingWidget(canvasWidget);
      })();

      widgetProps = { ...canvasWidgetProps };
      /**
       * MODAL_WIDGET by default is to be hidden unless the isVisible property is found.
       * If the isVisible property is undefined and the widget is MODAL_WIDGET then isVisible
       * is set to false
       * If the isVisible property is undefined and the widget is not MODAL_WIDGET then isVisible
       * is set to true
       */
      widgetProps.isVisible =
        canvasWidgetProps.isVisible ??
        canvasWidgetProps.type !== "MODAL_WIDGET";

      if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
        widgetProps.rightColumn = canvasWidgetProps.rightColumn;
        widgetProps.bottomRow = canvasWidgetProps.bottomRow;
        widgetProps.minHeight = canvasWidgetProps.minHeight;
        widgetProps.parentColumnSpace = canvasWidgetProps.parentColumnSpace;
        widgetProps.parentRowSpace = canvasWidgetProps.parentRowSpace;
      } else if (props.type === "CANVAS_WIDGET") {
        widgetProps.rightColumn = props.rightColumn;
        widgetProps.bottomRow = props.bottomRow;
        widgetProps.minHeight = props.minHeight;
        widgetProps.shouldScrollContents = props.shouldScrollContents;
        widgetProps.canExtend = props.canExtend;
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      widgetProps.childWidgets = childWidgets;
    }

    if (widgetProps) {
      widgetProps.renderMode = renderMode;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return <WrappedWidget {...props} {...widgetProps} />;
  }

  /**
   * TODO (Ashit): These might not be needed anymore as these were added when the
   * this HOC was the first wrapper of the Widget and then the metaHOC. By doing so
   * The metaHOC needed access to the following functions present in the Widget
   * These were just used as proxy to the metHOC.
   *
   * Now the metaHOC is the first layer and then the withWidgetProps so a proxy
   * might not be need. These needs to be double checked are removed.
   */
  WrappedPropsComponent.getMetaPropertiesMap =
    WrappedWidget.getMetaPropertiesMap;
  WrappedPropsComponent.getDefaultPropertiesMap =
    WrappedWidget.getDefaultPropertiesMap;
  return WrappedPropsComponent;
}

export default withWidgetProps;
