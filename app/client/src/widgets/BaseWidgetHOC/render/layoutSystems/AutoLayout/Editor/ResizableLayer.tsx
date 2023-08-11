import React, { useMemo } from "react";
import AutoLayoutResizableComponent from "components/editorComponents/WidgetResizer/AutoLayoutResizableComponent";
import { WIDGET_PADDING } from "constants/WidgetConstants";
import { get, isFunction, omit } from "lodash";
import WidgetFactory from "utils/WidgetFactory";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import Resizable from "components/editorComponents/WidgetResizer/resizable/modalresize";
import AnalyticsUtil from "utils/AnalyticsUtil";
import type { UIElementSize } from "components/editorComponents/WidgetResizer/ResizableUtils";
import {
  BottomHandleStyles,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
} from "components/editorComponents/WidgetResizer/ResizeStyledComponents";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { Classes } from "@blueprintjs/core";

export const ResizableLayer = (props: BaseWidgetProps) => {
  if (props.resizeDisabled || props.type === "SKELETON_WIDGET") {
    return props.children;
  }
  let autoDimensionConfig = WidgetFactory.getWidgetAutoLayoutConfig(
    props.type,
  ).autoDimension;
  if (isFunction(autoDimensionConfig)) {
    autoDimensionConfig = autoDimensionConfig(props);
  }
  return (
    <AutoLayoutResizableComponent
      {...props}
      hasAutoHeight={autoDimensionConfig?.height}
      hasAutoWidth={autoDimensionConfig?.width}
      paddingOffset={WIDGET_PADDING}
    >
      {props.children}
    </AutoLayoutResizableComponent>
  );
};

export const ModalResizableLayer = (props: BaseWidgetProps) => {
  const disabledResizeHandles = get(props, "disabledResizeHandles", []);
  const handles = useMemo(() => {
    const allHandles = {
      left: LeftHandleStyles,
      top: TopHandleStyles,
      bottom: BottomHandleStyles,
      right: RightHandleStyles,
    };

    return omit(allHandles, disabledResizeHandles);
  }, [disabledResizeHandles]);
  const { setIsResizing } = useWidgetDragResize();
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const onResizeStop = (dimensions: UIElementSize) => {
    props.resizeModal && props.resizeModal(dimensions);
    // Tell the Canvas that we've stopped resizing
    // Put it later in the stack so that other updates like click, are not propagated to the parent container
    setTimeout(() => {
      setIsResizing && setIsResizing(false);
    }, 0);
  };

  const onResizeStart = () => {
    setIsResizing && !isResizing && setIsResizing(true);
    AnalyticsUtil.logEvent("WIDGET_RESIZE_START", {
      widgetName: props.widgetName,
      widgetType: "MODAL_WIDGET",
    });
  };
  return (
    <Resizable
      allowResize
      className={Classes.OVERLAY_CONTENT}
      componentHeight={props.height || 0}
      componentWidth={props.width || 0}
      enableHorizontalResize
      enableVerticalResize={false}
      handles={handles}
      isColliding={() => false}
      onStart={onResizeStart}
      onStop={onResizeStop}
      resizeDualSides
      showLightBorder
      snapGrid={{ x: 1, y: 1 }}
      widgetId={props.widgetId}
    >
      {props.children}
    </Resizable>
  );
};
