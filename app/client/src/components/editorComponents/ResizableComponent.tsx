import React, { useContext, memo, useMemo } from "react";
import {
  WidgetOperations,
  WidgetRowCols,
  WidgetProps,
} from "widgets/BaseWidget";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import {
  UIElementSize,
  computeFinalRowCols,
  computeRowCols,
} from "./ResizableUtils";
import {
  useShowPropertyPane,
  useShowTableFilterPane,
  useWidgetDragResize,
} from "utils/hooks/dragResizeHooks";
import { useSelector } from "react-redux";
import { AppState } from "reducers";
import Resizable from "resizable/resizenreflow";
import { omit, get } from "lodash";
import { getSnapColumns } from "utils/WidgetPropsUtils";
import {
  VisibilityContainer,
  LeftHandleStyles,
  RightHandleStyles,
  TopHandleStyles,
  BottomHandleStyles,
  TopLeftHandleStyles,
  TopRightHandleStyles,
  BottomLeftHandleStyles,
  BottomRightHandleStyles,
} from "./ResizeStyledComponents";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { commentModeSelector } from "selectors/commentsSelectors";
import {
  previewModeSelector,
  snipingModeSelector,
} from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { focusWidget } from "actions/widgetActions";
import { getParentToOpenIfAny } from "utils/hooks/useClickToSelectWidget";
import { GridDefaults } from "constants/WidgetConstants";
import { DropTargetContext } from "./DropTargetComponent";
import { XYCord } from "pages/common/CanvasArenas/hooks/useCanvasDragging";

export type ResizableComponentProps = WidgetProps & {
  paddingOffset: number;
};

export const ResizableComponent = memo(function ResizableComponent(
  props: ResizableComponentProps,
) {
  // Fetch information from the context
  const { updateWidget } = useContext(EditorContext);
  const canvasWidgets = useSelector(getCanvasWidgets);

  const isCommentMode = useSelector(commentModeSelector);
  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);

  const showPropertyPane = useShowPropertyPane();
  const showTableFilterPane = useShowTableFilterPane();
  const { selectWidget } = useWidgetSelection();
  const { setIsResizing } = useWidgetDragResize();
  const selectedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.lastSelectedWidget,
  );
  const selectedWidgets = useSelector(
    (state: AppState) => state.ui.widgetDragResize.selectedWidgets,
  );
  const focusedWidget = useSelector(
    (state: AppState) => state.ui.widgetDragResize.focusedWidget,
  );

  const isDragging = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isDragging,
  );
  const isResizing = useSelector(
    (state: AppState) => state.ui.widgetDragResize.isResizing,
  );
  const parentWidgetToSelect = getParentToOpenIfAny(
    props.widgetId,
    canvasWidgets,
  );

  const isWidgetFocused =
    focusedWidget === props.widgetId ||
    selectedWidget === props.widgetId ||
    selectedWidgets.includes(props.widgetId);

  // Calculate the dimensions of the widget,
  // The ResizableContainer's size prop is controlled
  const dimensions: UIElementSize = {
    width:
      (props.rightColumn - props.leftColumn) * props.parentColumnSpace -
      2 * props.paddingOffset,
    height:
      (props.bottomRow - props.topRow) * props.parentRowSpace -
      2 * props.paddingOffset,
  };

  // onResize handler
  const getResizedPositions = (
    newDimensions: UIElementSize,
    position: XYCord,
  ) => {
    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };
    const newRowCols: WidgetRowCols = computeRowCols(delta, position, props);
    let canResizeHorizontally = true,
      canResizeVertically = true;

    // this is required for list widget so that template have no collision
    if (props.ignoreCollision)
      return {
        canResizeHorizontally,
        canResizeVertically,
      };

    if (
      newRowCols &&
      (newRowCols.rightColumn > getSnapColumns() ||
        newRowCols.leftColumn < 0 ||
        newRowCols.rightColumn - newRowCols.leftColumn < 2)
    ) {
      canResizeHorizontally = false;
    }

    if (
      newRowCols &&
      (newRowCols.topRow < 0 || newRowCols.bottomRow - newRowCols.topRow < 4)
    ) {
      canResizeVertically = false;
    }

    const resizedPositions = {
      id: props.widgetId,
      left: newRowCols.leftColumn,
      top: newRowCols.topRow,
      bottom: newRowCols.bottomRow,
      right: newRowCols.rightColumn,
    };

    // Check if new row cols are occupied by sibling widgets
    return {
      canResizeHorizontally,
      canResizeVertically,
      resizedPositions,
    };
  };

  // onResizeStop handler
  // when done resizing, check if;
  // 1) There is no collision
  // 2) There is a change in widget size
  // Update widget, if both of the above are true.
  const updateSize = (newDimensions: UIElementSize, position: XYCord) => {
    // Get the difference in size of the widget, before and after resizing.
    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };

    // Get the updated Widget rows and columns props
    // False, if there is collision
    // False, if none of the rows and cols have changed.
    const newRowCols: WidgetRowCols | false = computeFinalRowCols(
      delta,
      position,
      props,
    );

    if (newRowCols) {
      updateWidget &&
        updateWidget(WidgetOperations.RESIZE, props.widgetId, {
          ...newRowCols,
          parentId: props.parentId,
          snapColumnSpace: props.parentColumnSpace,
          snapRowSpace: props.parentRowSpace,
        });
    }
    // Tell the Canvas that we've stopped resizing
    // Put it later in the stack so that other updates like click, are not propagated to the parent container
    setTimeout(() => {
      setIsResizing && setIsResizing(false);
    }, 0);
    // Tell the Canvas to put the focus back to this widget
    // By setting the focus, we enable the control buttons on the widget
    selectWidget &&
      selectedWidget !== props.widgetId &&
      parentWidgetToSelect?.widgetId !== props.widgetId &&
      selectWidget(props.widgetId);

    if (parentWidgetToSelect) {
      selectWidget &&
        selectedWidget !== parentWidgetToSelect.widgetId &&
        selectWidget(parentWidgetToSelect.widgetId);
      focusWidget(parentWidgetToSelect.widgetId);
    } else {
      selectWidget &&
        selectedWidget !== props.widgetId &&
        selectWidget(props.widgetId);
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

  const handleResizeStart = () => {
    setIsResizing && !isResizing && setIsResizing(true);
    selectWidget &&
      selectedWidget !== props.widgetId &&
      selectWidget(props.widgetId);
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

    return omit(allHandles, get(props, "disabledResizeHandles", []));
  }, [props]);

  const isEnabled =
    !isDragging &&
    isWidgetFocused &&
    !props.resizeDisabled &&
    !isCommentMode &&
    !isSnipingMode &&
    !isPreviewMode;
  const isMultiSelectedWidget =
    selectedWidgets &&
    selectedWidgets.length > 1 &&
    selectedWidgets.includes(props.widgetId);
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

  return (
    <Resizable
      allowResize={!isMultiSelectedWidget}
      componentHeight={dimensions.height}
      componentWidth={dimensions.width}
      enable={isEnabled}
      getResizedPositions={getResizedPositions}
      gridProps={gridProps}
      handles={handles}
      onStart={handleResizeStart}
      onStop={updateSize}
      originalPositions={originalPositions}
      parentId={props.parentId}
      snapGrid={{ x: props.parentColumnSpace, y: props.parentRowSpace }}
      updateBottomRow={updateBottomRow}
      widgetId={props.widgetId}
      // Used only for performance tracking, can be removed after optimization.
      zWidgetId={props.widgetId}
      zWidgetType={props.type}
    >
      <VisibilityContainer
        padding={props.paddingOffset}
        visible={!!props.isVisible}
      >
        {props.children}
      </VisibilityContainer>
    </Resizable>
  );
});
export default ResizableComponent;
