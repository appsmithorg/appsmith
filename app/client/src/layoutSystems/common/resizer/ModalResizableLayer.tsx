import React, { useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { get, omit } from "lodash";
import type { BaseWidgetProps } from "widgets/BaseWidgetHOC/withBaseWidgetHOC";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { useWidgetDragResize } from "utils/hooks/dragResizeHooks";
import { useSelector } from "react-redux";
import type { AppState } from "ee/reducers";
import { Classes } from "@blueprintjs/core";
import { ModalResizable } from "layoutSystems/common/resizer/ModalResizable";
import { isAutoHeightEnabledForWidget } from "widgets/WidgetUtils";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { getWidgetByID } from "sagas/selectors";
import {
  BottomHandleStyles,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
} from "./ResizeStyledComponents";
import type { UIElementSize } from "./ResizableUtils";
import { useModalWidth } from "widgets/ModalWidget/component/useModalWidth";
import { snipingModeSelector } from "selectors/editorSelectors";
import { getWidgetSelectionBlock } from "../../../selectors/ui";
import { selectCombinedPreviewMode } from "selectors/gitModSelectors";
const minSize = 100;

/**
 * ModalResizableLayer
 *
 * Component that enhances props suplied to ModalResizable
 * Provides widget specific implementations of onStart and onStop props of ModalResizable.
 *
 */

export const ModalResizableLayer = ({
  children,
  enableHorizontalResize,
  enableVerticalResize,
  widgetProps,
}: {
  widgetProps: BaseWidgetProps;
  enableVerticalResize: boolean;
  enableHorizontalResize: boolean;
  children: ReactNode;
}) => {
  const { updateWidget } = useContext(EditorContext);
  const widget = useSelector(getWidgetByID(widgetProps.widgetId));
  const disabledResizeHandles = get(widgetProps, "disabledResizeHandles", []);
  const getModalWidth = useModalWidth();
  const modalWidth = getModalWidth(widgetProps.width);
  const onModalResize = (dimensions: UIElementSize) => {
    const newDimensions = {
      height: Math.max(minSize, dimensions.height),
      width: Math.max(minSize, getModalWidth(dimensions.width)),
    };

    if (
      newDimensions.height !== widgetProps.height &&
      isAutoHeightEnabledForWidget(widgetProps)
    )
      return;

    const canvasWidgetId =
      widget.children && widget.children.length > 0 ? widget.children[0] : "";

    updateWidget &&
      updateWidget("MODAL_RESIZE", widgetProps.widgetId, {
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
      widgetName: widgetProps.widgetName,
      widgetType: "MODAL_WIDGET",
    });
  };
  const isPreviewMode = useSelector(selectCombinedPreviewMode);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isWidgetSelectionBlocked = useSelector(getWidgetSelectionBlock);
  const enableResizing =
    !isSnipingMode && !isPreviewMode && !isWidgetSelectionBlocked;

  return (
    <ModalResizable
      allowResize
      className={Classes.OVERLAY_CONTENT}
      componentHeight={widgetProps.height || 0}
      componentWidth={modalWidth}
      enableHorizontalResize={enableResizing && enableHorizontalResize}
      enableVerticalResize={enableResizing && enableVerticalResize}
      handles={handles}
      isColliding={() => false}
      onStart={onResizeStart}
      onStop={onResizeStop}
      resizeDualSides
      showLightBorder
      snapGrid={{ x: 1, y: 1 }}
      widgetId={widgetProps.widgetId}
    >
      {children}
    </ModalResizable>
  );
};
