import equal from "fast-deep-equal/es6";
import React from "react";

import BaseWidget, { WidgetProps } from "./BaseWidget";
import {
  MAIN_CONTAINER_WIDGET_ID,
  RenderModes,
} from "constants/WidgetConstants";
import {
  getWidgetEvalValues,
  getIsWidgetLoading,
} from "selectors/dataTreeSelectors";
import {
  getMainCanvasProps,
  computeMainContainerWidget,
  getChildWidgets,
  getRenderMode,
  getMetaWidgetChildrenStructure,
  getMetaWidget,
  getFlattenedChildCanvasWidgets,
} from "selectors/editorSelectors";
import { AppState } from "@appsmith/reducers";
import { useSelector } from "react-redux";
import { getWidget } from "sagas/selectors";
import {
  createCanvasWidget,
  createLoadingWidget,
} from "utils/widgetRenderUtils";

const WIDGETS_WITH_CHILD_WIDGETS = ["LIST_WIDGET", "FORM_WIDGET"];

function withWidgetProps(WrappedWidget: typeof BaseWidget) {
  function WrappedPropsComponent(
    props: WidgetProps & { skipWidgetPropsHydration?: boolean },
  ) {
    const {
      children,
      hasMetaWidgets,
      referencedWidgetId,
      requiresFlatWidgetChildren,
      skipWidgetPropsHydration,
      type,
      widgetId,
    } = props;

    const canvasWidget = useSelector((state: AppState) =>
      getWidget(state, widgetId),
    );
    const mainCanvasProps = useSelector((state: AppState) =>
      getMainCanvasProps(state),
    );
    const renderMode = useSelector(getRenderMode);
    const metaWidget = useSelector(getMetaWidget(widgetId));

    const widgetName = canvasWidget?.widgetName || metaWidget?.widgetName;

    const evaluatedWidget = useSelector((state: AppState) =>
      getWidgetEvalValues(state, widgetName),
    );
    const isLoading = useSelector((state: AppState) =>
      getIsWidgetLoading(state, widgetName),
    );

    const metaWidgetChildrenStructure = useSelector(
      getMetaWidgetChildrenStructure(widgetId, type, hasMetaWidgets),
      equal,
    );

    const childWidgets = useSelector((state: AppState) => {
      if (!WIDGETS_WITH_CHILD_WIDGETS.includes(type)) return undefined;
      return getChildWidgets(state, widgetId);
    }, equal);

    const flattenedChildCanvasWidgets = useSelector((state: AppState) => {
      if (requiresFlatWidgetChildren) {
        return getFlattenedChildCanvasWidgets(
          state,
          referencedWidgetId || widgetId,
        );
      }
    }, equal);

    let widgetProps: WidgetProps = {} as WidgetProps;
    const widget = metaWidget || canvasWidget;

    if (!skipWidgetPropsHydration) {
      const canvasWidgetProps = (() => {
        if (widgetId === MAIN_CONTAINER_WIDGET_ID) {
          return computeMainContainerWidget(canvasWidget, mainCanvasProps);
        }

        return evaluatedWidget
          ? createCanvasWidget(widget, evaluatedWidget)
          : createLoadingWidget(widget);
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

      if (
        props.type === "CANVAS_WIDGET" &&
        widgetId !== MAIN_CONTAINER_WIDGET_ID
      ) {
        widgetProps.rightColumn = props.rightColumn;
        widgetProps.bottomRow = props.bottomRow;
        widgetProps.minHeight = props.minHeight;
        widgetProps.shouldScrollContents = props.shouldScrollContents;
        widgetProps.canExtend = props.canExtend;
        widgetProps.parentId = props.parentId;
      } else if (widgetId !== MAIN_CONTAINER_WIDGET_ID) {
        widgetProps.parentColumnSpace = props.parentColumnSpace;
        widgetProps.parentRowSpace = props.parentRowSpace;
        widgetProps.parentId = props.parentId;

        // Form Widget Props
        widgetProps.onReset = props.onReset;
        if ("isFormValid" in props) widgetProps.isFormValid = props.isFormValid;
      }

      widgetProps.children = children;
      widgetProps.metaWidgetChildrenStructure = metaWidgetChildrenStructure;
      widgetProps.isLoading = isLoading;
      widgetProps.childWidgets = childWidgets;
      widgetProps.flattenedChildCanvasWidgets = flattenedChildCanvasWidgets;
    }

    //merging with original props
    widgetProps = { ...props, ...widgetProps, renderMode };

    // isVisible prop defines whether to render a detached widget
    if (widgetProps.detachFromLayout && !widgetProps.isVisible) {
      return null;
    }

    // We don't render invisible widgets in view mode
    if (renderMode === RenderModes.PAGE && !widgetProps.isVisible) {
      return null;
    }

    return <WrappedWidget {...widgetProps} />;
  }

  return WrappedPropsComponent;
}

export default withWidgetProps;
