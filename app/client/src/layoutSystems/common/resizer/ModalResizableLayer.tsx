import React, { useContext, useMemo } from "react";
import { get, omit } from "lodash";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useSelector } from "react-redux";
import type { AppState } from "@appsmith/reducers";
import { Classes } from "@blueprintjs/core";
import { ModalResizable } from "layoutSystems/common/resizer/ModalResizable";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import { MAX_MODAL_WIDTH_FROM_MAIN_WIDTH } from "constants/WidgetConstants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { getWidgetByID } from "sagas/selectors";
import { getCanvasWidth } from "selectors/editorSelectors";
import {
  BottomHandleStyles,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
} from "./ResizeStyledComponents";
import type { UIElementSize } from "./ResizableUtils";
const minSize = 100;

/**
 * ModalResizableLayer
 *
 * Component that enhances props suplied to ModalResizable
 * Provides widget specific implementations of onStart and onStop props of ModalResizable.
 *
 */

export const ModalResizableLayer = (props: BaseWidgetProps) => {
  const { updateWidget } = useContext(EditorContext);
  const widget = useSelector(getWidgetByID(props.widgetId));
  const disabledResizeHandles = get(props, "disabledResizeHandles", []);
  const mainCanvasWidth = useSelector(getCanvasWidth);
  const getMaxModalWidth = () => {
    return (mainCanvasWidth || 0) * MAX_MODAL_WIDTH_FROM_MAIN_WIDTH;
  };

  const getModalWidth = (width: number) => {
    return Math.min(getMaxModalWidth(), width);
  };
  const onModalResize = (dimensions: UIElementSize) => {
    const newDimensions = {
      height: Math.max(minSize, dimensions.height),
      width: Math.max(minSize, getModalWidth(dimensions.width)),
    };

    if (
      newDimensions.height !== props.height &&
      isAutoHeightEnabledForWidget(props)
    )
      return;

    const canvasWidgetId =
      widget.children && widget.children.length > 0 ? widget.children[0] : "";
    updateWidget &&
      updateWidget("MODAL_RESIZE", props.widgetId, {
        ...newDimensions,
        canvasWidgetId,
      });
  };
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
    onModalResize(dimensions);
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
    <ModalResizable
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
    </ModalResizable>
  );
};
