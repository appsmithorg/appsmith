import React, { useContext, useRef, memo, useMemo } from "react";
import { XYCord } from "utils/hooks/useCanvasDragging";

import {
  WidgetOperations,
  WidgetRowCols,
  WidgetProps,
} from "widgets/BaseWidget";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { generateClassName } from "utils/generators";
import { DropTargetContext } from "./DropTargetComponent";
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
import Resizable from "resizable";
import { omit, get, ceil } from "lodash";
import { getSnapColumns, isDropZoneOccupied } from "utils/WidgetPropsUtils";
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
import { scrollElementIntoParentCanvasView } from "utils/helpers";
import { getNearestParentCanvas } from "utils/generators";
import { getOccupiedSpaces } from "selectors/editorSelectors";
import { commentModeSelector } from "selectors/commentsSelectors";
import { snipingModeSelector } from "selectors/editorSelectors";
import { useWidgetSelection } from "utils/hooks/useWidgetSelection";
import { getCanvasWidgets } from "selectors/entitiesSelector";
import { focusWidget } from "actions/widgetActions";
import { getParentToOpenIfAny } from "utils/hooks/useClickToSelectWidget";

export type ResizableComponentProps = WidgetProps & {
  paddingOffset: number;
};

export const ResizableComponent = memo(function ResizableComponent(
  props: ResizableComponentProps,
) {
  const resizableRef = useRef<HTMLDivElement>(null);
  // Fetch information from the context
  const { updateWidget } = useContext(EditorContext);
  const occupiedSpaces = useSelector(getOccupiedSpaces);
  const canvasWidgets = useSelector(getCanvasWidgets);

  const { updateDropTargetRows } = useContext(DropTargetContext);

  const isCommentMode = useSelector(commentModeSelector);
  const isSnipingMode = useSelector(snipingModeSelector);

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

  const occupiedSpacesBySiblingWidgets = useMemo(() => {
    return occupiedSpaces && props.parentId && occupiedSpaces[props.parentId]
      ? occupiedSpaces[props.parentId]
      : undefined;
  }, [occupiedSpaces, props.parentId]);

  // isFocused (string | boolean) -> isWidgetFocused (boolean)
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

  // Resize bound's className - defaults to body
  // ResizableContainer accepts the className of the element,
  // whose clientRect will act as the bounds for resizing.
  // Note, if there are many containers with the same className
  // the bounding container becomes the nearest parent with the className
  const boundingElementClassName = generateClassName(props.parentId);
  const possibleBoundingElements = document.getElementsByClassName(
    boundingElementClassName,
  );
  const boundingElement =
    possibleBoundingElements.length > 0
      ? possibleBoundingElements[0]
      : undefined;

  // onResize handler
  // Checks if the current resize position has any collisions
  // If yes, set isColliding flag to true.
  // If no, set isColliding flag to false.
  const isColliding = (newDimensions: UIElementSize, position: XYCord) => {
    // Moving the bounding element calculations inside
    // to make this expensive operation only whne
    const boundingElementClientRect = boundingElement
      ? boundingElement.getBoundingClientRect()
      : undefined;

    const bottom =
      props.topRow +
      position.y / props.parentRowSpace +
      newDimensions.height / props.parentRowSpace;
    // Make sure to calculate collision IF we don't update the main container's rows
    let updated = false;
    if (updateDropTargetRows) {
      updated = !!updateDropTargetRows(props.widgetId, bottom);
      const el = resizableRef.current;
      if (el) {
        const { height } = el?.getBoundingClientRect();
        const scrollParent = getNearestParentCanvas(resizableRef.current);
        scrollElementIntoParentCanvasView(
          {
            top: 40,
            height,
          },
          scrollParent,
          el,
        );
      }
    }

    const delta: UIElementSize = {
      height: newDimensions.height - dimensions.height,
      width: newDimensions.width - dimensions.width,
    };
    const newRowCols: WidgetRowCols | false = computeRowCols(
      delta,
      position,
      props,
    );

    if (newRowCols.rightColumn > getSnapColumns()) {
      return true;
    }

    // Minimum row and columns to be set to a widget.
    if (
      newRowCols.rightColumn - newRowCols.leftColumn < 2 ||
      newRowCols.bottomRow - newRowCols.topRow < 4
    ) {
      return true;
    }

    if (
      boundingElementClientRect &&
      newRowCols.rightColumn * props.parentColumnSpace >
        ceil(boundingElementClientRect.width)
    ) {
      return true;
    }

    if (newRowCols && newRowCols.leftColumn < 0) {
      return true;
    }

    if (!updated) {
      if (
        boundingElementClientRect &&
        newRowCols.bottomRow * props.parentRowSpace >
          ceil(boundingElementClientRect.height)
      ) {
        return true;
      }

      if (newRowCols && newRowCols.topRow < 0) {
        return true;
      }
    }

    // this is required for list widget so that template have no collision
    if (props.ignoreCollision) return false;

    // Check if new row cols are occupied by sibling widgets
    return isDropZoneOccupied(
      {
        left: newRowCols.leftColumn,
        top: newRowCols.topRow,
        bottom: newRowCols.bottomRow,
        right: newRowCols.rightColumn,
      },
      props.widgetId,
      occupiedSpacesBySiblingWidgets,
    );
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
    !isSnipingMode;
  const isMultiSelectedWidget =
    selectedWidgets &&
    selectedWidgets.length > 1 &&
    selectedWidgets.includes(props.widgetId);

  return (
    <Resizable
      allowResize={!isMultiSelectedWidget}
      componentHeight={dimensions.height}
      componentWidth={dimensions.width}
      enable={isEnabled}
      handles={handles}
      isColliding={isColliding}
      onStart={handleResizeStart}
      onStop={updateSize}
      ref={resizableRef}
      snapGrid={{ x: props.parentColumnSpace, y: props.parentRowSpace }}
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
