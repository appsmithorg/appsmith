import type { AppState } from "@appsmith/reducers";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import { focusWidget } from "actions/widgetActions";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import type { OccupiedSpace } from "constants/CanvasEditorConstants";
import { DefaultDimensionMap, GridDefaults } from "constants/WidgetConstants";
import { get, omit } from "lodash";
import type { XYCord } from "pages/common/CanvasArenas/hooks/useRenderBlocksOnCanvas";
import React, { memo, useContext, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ReflowResizable as AutoLayoutResizable } from "resizable/autolayoutresize";
import { ReflowResizable as FixedLayoutResizable } from "resizable/resizenreflow";
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
import { ResponsiveBehavior } from "utils/autoLayout/constants";
import {
  getWidgetHeight,
  getWidgetWidth,
} from "utils/autoLayout/flexWidgetUtils";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import type { WidgetProps, WidgetRowCols } from "widgets/BaseWidget";
import { WidgetOperations } from "widgets/BaseWidget";
import { getSnapColumns } from "utils/WidgetPropsUtils";
import {
  isAutoHeightEnabledForWidget,
  isAutoHeightEnabledForWidgetWithLimits,
} from "widgets/WidgetUtils";
import { DropTargetContext } from "./DropTargetComponent";
import type { UIElementSize } from "./ResizableUtils";
import { computeFinalRowCols } from "./ResizableUtils";
import { computeFinalAutoLayoutRowCols } from "./ResizableUtils";
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

export type ResizableComponentProps = WidgetProps & {
  paddingOffset: number;
};

export const ResizableComponent = memo(function ResizableComponent(
  props: ResizableComponentProps,
) {
  // Fetch information from the context
  const { updateWidget } = useContext(EditorContext);
  const dispatch = useDispatch();
  const isAutoLayout = useSelector(getIsAutoLayout);

  const Resizable = isAutoLayout ? AutoLayoutResizable : FixedLayoutResizable;
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
    width:
      getWidgetWidth(props, !!props.isFlexChild ? !!props.isMobile : false) *
        props.parentColumnSpace -
      2 * props.paddingOffset,
    height:
      getWidgetHeight(props, !!props.isFlexChild ? !!props.isMobile : false) *
        props.parentRowSpace -
      2 * props.paddingOffset,
  };
  // onResize handler
  const getResizedPositions = (resizedPositions: OccupiedSpace) => {
    let canResizeVertically = true;
    let canResizeHorizontally = true;

    // this is required for list widget so that template have no collision
    if (props.ignoreCollision)
      return {
        canResizeHorizontally,
        canResizeVertically,
      };

    if (
      resizedPositions &&
      (resizedPositions.right > getSnapColumns() ||
        resizedPositions.left < 0 ||
        resizedPositions.right - resizedPositions.left < 2)
    ) {
      canResizeHorizontally = false;
    }

    if (
      resizedPositions &&
      (resizedPositions.top < 0 ||
        resizedPositions.bottom - resizedPositions.top < 4)
    ) {
      canResizeVertically = false;
    }

    if (isAutoHeightEnabledForWidget(props)) {
      canResizeVertically = false;
      resizedPositions.top = props.topRow;
      resizedPositions.bottom = props.bottomRow;
    }

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
  const updateSize = (
    newDimensions: UIElementSize,
    position: XYCord,
    dimensionMap = DefaultDimensionMap,
  ) => {
    // Get the difference in size of the widget, before and after resizing.
    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };

    const {
      bottomRow: bottomRowMap,
      leftColumn: leftColumnMap,
      rightColumn: rightColumnMap,
      topRow: topRowMap,
    } = dimensionMap;
    const {
      parentColumnSpace,
      parentRowSpace,
      [bottomRowMap]: bottomRow,
      [leftColumnMap]: leftColumn,
      [rightColumnMap]: rightColumn,
      [topRowMap]: topRow,
    } = props as any;

    // Get the updated Widget rows and columns props
    // False, if there is collision
    // False, if none of the rows and cols have changed.
    const newRowCols: WidgetRowCols | false = isAutoLayout
      ? computeFinalAutoLayoutRowCols(delta, position, {
          bottomRow,
          topRow,
          leftColumn,
          rightColumn,
          parentColumnSpace,
          parentRowSpace,
        })
      : computeFinalRowCols(delta, position, {
          bottomRow,
          topRow,
          leftColumn,
          rightColumn,
          parentColumnSpace,
          parentRowSpace,
        });

    if (newRowCols) {
      updateWidget &&
        updateWidget(WidgetOperations.RESIZE, props.widgetId, {
          [leftColumnMap]: newRowCols.leftColumn,
          [rightColumnMap]: newRowCols.rightColumn,
          [topRowMap]: newRowCols.topRow,
          [bottomRowMap]: newRowCols.bottomRow,
          parentId: props.parentId,
          snapColumnSpace: props.parentColumnSpace,
          snapRowSpace: props.parentRowSpace,
        });
    }
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

  const handleResizeStart = (affectsWidth = false) => {
    setIsResizing && !isResizing && setIsResizing(true);
    selectWidget &&
      !isLastSelected &&
      selectWidget(SelectionRequestType.One, [props.widgetId]);
    // Make sure that this tableFilterPane should close
    showTableFilterPane && showTableFilterPane();
    // If resizing a fill widget "horizontally", then convert it to a hug widget.
    if (
      props.isFlexChild &&
      props.responsiveBehavior === ResponsiveBehavior.Fill &&
      affectsWidth
    )
      dispatch(
        batchUpdateMultipleWidgetProperties([
          {
            widgetId: props.widgetId,
            updates: {
              modify: {
                responsiveBehavior: ResponsiveBehavior.Hug,
              },
            },
          },
        ]),
      );
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
  const { updateDropTargetRows } = useContext(DropTargetContext);

  const gridProps = {
    parentColumnSpace: props.parentColumnSpace,
    parentRowSpace: props.parentRowSpace,
    paddingOffset: props.paddingOffset,
    maxGridColumns: GridDefaults.DEFAULT_GRID_COLUMNS,
  };

  const originalPositions = {
    id: props.widgetId,
    left: props.leftColumn,
    top: props.topRow,
    bottom: props.bottomRow,
    right: props.rightColumn,
  };
  const updateBottomRow = (bottom: number) => {
    if (props.parentId) {
      updateDropTargetRows && updateDropTargetRows([props.parentId], bottom);
    }
  };

  const snapGrid = useMemo(
    () => ({
      x: props.parentColumnSpace,
      y: props.parentRowSpace,
    }),
    [props.parentColumnSpace, props.parentRowSpace],
  );

  const isVerticalResizeEnabled = useMemo(() => {
    return !isAutoHeightEnabledForWidget(props) && isEnabled;
  }, [props, isAutoHeightEnabledForWidget, isEnabled]);

  const fixedHeight =
    isAutoHeightEnabledForWidgetWithLimits(props) ||
    !isAutoHeightEnabledForWidget(props) ||
    !props.isCanvas;

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
    <Resizable
      allowResize={allowResize}
      componentHeight={dimensions.height}
      componentWidth={dimensions.width}
      direction={props.direction}
      enableHorizontalResize={isEnabled}
      enableVerticalResize={isVerticalResizeEnabled}
      fixedHeight={fixedHeight}
      getResizedPositions={getResizedPositions}
      gridProps={gridProps}
      handles={handles}
      isFlexChild={props.isFlexChild}
      isHovered={isHovered}
      isMobile={props.isMobile || false}
      maxDynamicHeight={props.maxDynamicHeight}
      onStart={handleResizeStart}
      onStop={updateSize}
      originalPositions={originalPositions}
      paddingOffset={props.paddingOffset}
      parentId={props.parentId}
      responsiveBehavior={props.responsiveBehavior}
      showResizeBoundary={showResizeBoundary}
      snapGrid={snapGrid}
      topRow={props.topRow}
      updateBottomRow={updateBottomRow}
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
    </Resizable>
  );
});
export default ResizableComponent;
