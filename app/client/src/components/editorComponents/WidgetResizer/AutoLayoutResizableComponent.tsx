import type { AppState } from "@appsmith/reducers";
import { focusWidget } from "actions/widgetActions";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { GridDefaults, WidgetHeightLimits } from "constants/WidgetConstants";
import { get, omit } from "lodash";
import React, { memo, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReflowResizable as AutoLayoutResizable } from "components/editorComponents/WidgetResizer/resizable/autolayoutresize";
import { SelectionRequestType } from "sagas/WidgetSelectUtils";
import { getIsAutoLayout } from "selectors/canvasSelectors";
import { getIsAppSettingsPaneWithNavigationTabOpen } from "selectors/appSettingsPaneSelectors";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import {
  getParentToOpenSelector,
  isCurrentWidgetFocused,
  isCurrentWidgetLastSelected,
  isMultiSelectedWidget,
  isWidgetSelected,
} from "selectors/widgetSelectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { WidgetOperations } from "widgets/BaseWidget";
import {
  isAutoHeightEnabledForWidget,
  isAutoHeightEnabledForWidgetWithLimits,
} from "widgets/WidgetUtils";
import type { UIElementSize } from "./ResizableUtils";
import {
  BottomHandleStyles,
  BottomLeftHandleStyles,
  BottomRightHandleStyles,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
  TopLeftHandleStyles,
  TopRightHandleStyles,
  VisibilityContainer,
} from "./ResizeStyledComponents";
import { ReduxActionTypes } from "@appsmith/constants/ReduxActionConstants";
import type { ResizableComponentProps } from "./ResizableComponent";
import { ResponsiveBehavior } from "utils/autoLayout/constants";

export const AutoLayoutResizableComponent = memo(function ResizableComponent(
  props: ResizableComponentProps,
) {
  // Fetch information from the context
  const { updateWidget } = useContext(EditorContext);
  const dispatch = useDispatch();
  const isAutoLayout = useSelector(getIsAutoLayout);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);
  const isAppSettingsPaneWithNavigationTabOpen = useSelector(
    getIsAppSettingsPaneWithNavigationTabOpen,
  );

  const showPropertyPane = useShowPropertyPane();
  const showTableFilterPane = useShowTableFilterPane();
  const { selectWidget } = useWidgetSelection();
  const { setIsResizing } = useWidgetDragResize();
  // Check if current widget is in the list of selected widgets
  const isSelected = useSelector(isWidgetSelected(props.widgetId));
  // Check if current widget is the last selected widget
  const isLastSelected = useSelector(
    isCurrentWidgetLastSelected(props.widgetId),
  );
  const isFocused = useSelector(isCurrentWidgetFocused(props.widgetId));
  // Check if current widget is one of multiple selected widgets
  const isMultiSelected = useSelector(isMultiSelectedWidget(props.widgetId));

  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const parentWidgetToSelect = useSelector(
    getParentToOpenSelector(props.widgetId),
  );
  const isParentWidgetSelected = useSelector(
    isCurrentWidgetLastSelected(parentWidgetToSelect?.widgetId || ""),
  );
  const isWidgetFocused = isFocused || isLastSelected || isSelected;

  // Calculate the dimensions of the widget,
  // The ResizableContainer's size prop is controlled
  const dimensions: UIElementSize = {
    width: props.componentWidth,
    height: props.componentHeight,
  };
  // onResize handler
  const getResizedPositions = () =>
    // resizedPositions: OccupiedSpace
    {
      const canResizeVertically = true;
      const canResizeHorizontally = true;

      // Check if new row cols are occupied by sibling widgets
      return {
        canResizeHorizontally,
        canResizeVertically,
      };
    };

  // onResizeStop handler
  // when done resizing, check if;
  // 1) There is no collision
  // 2) There is a change in widget size
  // Update widget, if both of the above are true.
  const updateSize = (newDimensions: UIElementSize) => {
    updateWidget &&
      updateWidget(WidgetOperations.RESIZE, props.widgetId, {
        width: newDimensions.width,
        height: newDimensions.height,
        parentId: props.parentId,
      });
    // Tell the Canvas that we've stopped resizing
    // Put it later in the stack so that other updates like click, are not propagated to the parent container
    setTimeout(() => {
      setIsResizing && setIsResizing(false);

      if (isAutoLayout) {
        dispatch({
          type: ReduxActionTypes.PROCESS_AUTO_LAYOUT_DIMENSION_UPDATES,
        });
      }
    }, 0);
    // Tell the Canvas to put the focus back to this widget
    // By setting the focus, we enable the control buttons on the widget
    selectWidget &&
      !isLastSelected &&
      parentWidgetToSelect?.widgetId !== props.widgetId &&
      selectWidget(SelectionRequestType.One, [props.widgetId]);

    if (parentWidgetToSelect) {
      selectWidget &&
        !isParentWidgetSelected &&
        selectWidget(SelectionRequestType.One, [parentWidgetToSelect.widgetId]);
      focusWidget(parentWidgetToSelect.widgetId);
    } else {
      selectWidget &&
        !isLastSelected &&
        selectWidget(SelectionRequestType.One, [props.widgetId]);
    }
    // Property pane closes after a resize/drag
    showPropertyPane && showPropertyPane();
    AnalyticsUtil.logEvent("WIDGET_RESIZE_END", {
      widgetName: props.widgetName,
      widgetType: props.type,
      startHeight: dimensions.height,
      startWidth: dimensions.width,
      endHeight: newDimensions.height,
      endWidth: newDimensions.width,
    });
  };

  const handleResizeStart = () =>
    // affectsWidth = false
    {
      setIsResizing && !isResizing && setIsResizing(true);
      selectWidget &&
        !isLastSelected &&
        selectWidget(SelectionRequestType.One, [props.widgetId]);
      // Make sure that this tableFilterPane should close
      showTableFilterPane && showTableFilterPane();
      AnalyticsUtil.logEvent("WIDGET_RESIZE_START", {
        widgetName: props.widgetName,
        widgetType: props.type,
      });
    };
  const handles = useMemo(() => {
    const allHandles = {
      left: LeftHandleStyles,
      top: TopHandleStyles,
      bottom: BottomHandleStyles,
      right: RightHandleStyles,
      bottomRight: BottomRightHandleStyles,
      topLeft: TopLeftHandleStyles,
      topRight: TopRightHandleStyles,
      bottomLeft: BottomLeftHandleStyles,
    };
    const handlesToOmit = get(props, "disabledResizeHandles", []);
    return omit(allHandles, handlesToOmit);
  }, [props]);
  const isAutoCanvasResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isAutoCanvasResizing,
  );

  const isEnabled =
    !isAutoCanvasResizing &&
    !isDragging &&
    isWidgetFocused &&
    !props.resizeDisabled &&
    !isSnipingMode &&
    !isPreviewMode &&
    !isAppSettingsPaneWithNavigationTabOpen;

  const originalPositions = {
    id: props.widgetId,
    left: props.leftColumn,
    top: props.topRow,
    bottom: props.bottomRow,
    right: props.rightColumn,
  };

  const snapGrid = {
    x: 1,
    y: 1,
  };

  const isVerticalResizeEnabled = useMemo(() => {
    return !isAutoHeightEnabledForWidget(props) && isEnabled;
  }, [props, isAutoHeightEnabledForWidget, isEnabled]);

  // What is the max resizable height for this widget, in pixels?
  let maxHeightInPx =
    WidgetHeightLimits.MAX_HEIGHT_IN_ROWS *
    GridDefaults.DEFAULT_GRID_ROW_HEIGHT; // Maximum possible height
  // If the widget has auto height with limits, we need to respect the set limits.
  if (isAutoHeightEnabledForWidgetWithLimits(props)) {
    maxHeightInPx =
      (props.maxDynamicHeight || WidgetHeightLimits.MAX_HEIGHT_IN_ROWS) *
      GridDefaults.DEFAULT_GRID_ROW_HEIGHT;
  }

  const allowResize: boolean =
    !isMultiSelected || (isAutoLayout && !props.isFlexChild);

  const isHovered = isFocused && !isSelected;
  const showResizeBoundary =
    !isAutoCanvasResizing &&
    !isPreviewMode &&
    !isAppSettingsPaneWithNavigationTabOpen &&
    !isDragging &&
    (isHovered || isSelected);

  return (
    <AutoLayoutResizable
      allowResize={allowResize}
      componentHeight={dimensions.height}
      componentWidth={dimensions.width}
      direction={props.direction}
      enableHorizontalResize={isEnabled}
      enableVerticalResize={isVerticalResizeEnabled}
      getResizedPositions={getResizedPositions}
      handles={handles}
      hasAutoHeight={
        props.hasAutoHeight ||
        props.responsiveBehavior === ResponsiveBehavior.Fill
      }
      hasAutoWidth={
        props.hasAutoWidth ||
        props.responsiveBehavior === ResponsiveBehavior.Fill
      }
      isFlexChild={props.isFlexChild}
      isHovered={isHovered}
      isMobile={props.isMobile || false}
      mainCanvasWidth={props.mainCanvasWidth || 1}
      maxHeightInPx={maxHeightInPx}
      onStart={handleResizeStart}
      onStop={updateSize}
      originalPositions={originalPositions}
      paddingOffset={props.paddingOffset}
      parentId={props.parentId}
      responsiveBehavior={props.responsiveBehavior}
      showResizeBoundary={showResizeBoundary}
      snapGrid={snapGrid}
      // Used only for performance tracking, can be removed after optimization.
      widgetId={props.widgetId}
      zWidgetId={props.widgetId}
      zWidgetType={props.type}
    >
      <VisibilityContainer
        padding={props.paddingOffset}
        reduceOpacity={props.isFlexChild ? isSelected && isDragging : false}
        visible={!!props.isVisible}
      >
        {props.children}
      </VisibilityContainer>
    </AutoLayoutResizable>
  );
});
export default AutoLayoutResizableComponent;
