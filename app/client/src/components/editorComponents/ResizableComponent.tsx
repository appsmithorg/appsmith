import { AppState } from "@appsmith/reducers";
import { focusWidget } from "actions/widgetActions";
import {
  AlignItems,
  LayoutDirection,
  ResponsiveBehavior,
} from "components/constants";
import { EditorContext } from "components/editorComponents/EditorContextProvider";
import { GridDefaults } from "constants/WidgetConstants";
import { get, omit } from "lodash";
import { XYCord } from "pages/common/CanvasArenas/hooks/useCanvasDragging";
import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import Resizable from "resizable/resizenreflow";
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
import { getSnapColumns } from "utils/WidgetPropsUtils";
import {
  WidgetOperations,
  WidgetProps,
  WidgetRowCols,
} from "widgets/BaseWidget";
import { DropTargetContext } from "./DropTargetComponent";
import {
  computeFinalRowCols,
  computeRowCols,
  UIElementSize,
} from "./ResizableUtils";
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

export type ResizableComponentProps = WidgetProps & {
  paddingOffset: number;
};

export const ResizableComponent = memo(function ResizableComponent(
  props: ResizableComponentProps,
) {
  const [componentWidth, setComponentWidth] = useState<number>(0);
  const [componentHeight, setComponentHeight] = useState<number>(0);
  // Fetch information from the context
  const { updateWidget } = useContext(EditorContext);

  const isHorizontallyStretched =
    props.direction === LayoutDirection.Vertical &&
    props.alignItems === AlignItems.Stretch;

  const isSnipingMode = useSelector(snipingModeSelector);
  const isPreviewMode = useSelector(previewModeSelector);

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
  const isWidgetFocused: boolean = isFocused || isLastSelected || isSelected;

  useEffect(() => {
    // Set initial dimensions
    // if (props.widgetName.toLowerCase().includes("button"))
    //   console.log(`#### ${props.widgetName} : Initial dimensions`);
    setComponentWidth(
      props.useAutoLayout && isHorizontallyStretched
        ? 64 * props.parentColumnSpace - 2 * props.paddingOffset
        : (props.rightColumn - props.leftColumn) * props.parentColumnSpace -
            2 * props.paddingOffset,
    );
    setComponentHeight(
      (props.bottomRow - props.topRow) * props.parentRowSpace -
        2 * props.paddingOffset,
    );
  }, [props.useAutoLayout, props.direction, props.alignItems]);

  useEffect(() => {
    // if (props.widgetName.toLowerCase().includes("button"))
    //   console.log(`#### ${props.widgetName} : Manual resize`);
    setComponentWidth(
      props.useAutoLayout && isHorizontallyStretched
        ? 64 * props.parentColumnSpace - 2 * props.paddingOffset
        : (props.rightColumn - props.leftColumn) * props.parentColumnSpace -
            2 * props.paddingOffset,
    );
    setComponentHeight(
      (props.bottomRow - props.topRow) * props.parentRowSpace -
        2 * props.paddingOffset,
    );
  }, [props.topRow, props.bottomRow, props.leftColumn, props.rightColumn]);

  useEffect(() => {
    // if (props.widgetName.toLowerCase().includes("button"))
    //   console.log(`#### ${props.widgetName} : Parent resize`);
    if (!props.useAutoLayout) {
      setComponentWidth(
        (props.rightColumn - props.leftColumn) * props.parentColumnSpace -
          2 * props.paddingOffset,
      );
      setComponentHeight(
        (props.bottomRow - props.topRow) * props.parentRowSpace -
          2 * props.paddingOffset,
      );
    } else {
      if (isHorizontallyStretched) {
        setComponentWidth(
          64 * props.parentColumnSpace - 2 * props.paddingOffset,
        );
      }
    }
  }, [props.parentColumnSpace, props.parentRowSpace, props.useAutoLayout]);

  // Calculate the dimensions of the widget,
  // The ResizableContainer's size prop is controlled
  // const dimensions: UIElementSize = {
  //   width:
  //     useAutoLayout &&
  //     direction === LayoutDirection.Vertical &&
  //     alignItems === AlignItems.Stretch
  //       ? 64 * props.parentColumnSpace - 2 * props.paddingOffset
  //       : (props.rightColumn - props.leftColumn) * props.parentColumnSpace -
  //         2 * props.paddingOffset,
  //   height:
  //     (props.bottomRow - props.topRow) * props.parentRowSpace -
  //     2 * props.paddingOffset,
  // };

  // console.log(`#### ${props.widgetName} : width - ${componentWidth}`);
  // console.log(`#### ${props.widgetName} : bottomRow - ${props.bottomRow}`);

  // onResize handler
  const getResizedPositions = (
    newDimensions: UIElementSize,
    position: XYCord,
  ) => {
    const delta: UIElementSize = {
      height: newDimensions.height - componentHeight,
      width: newDimensions.width - componentWidth,
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
    // console.log(`#### ${props.widgetName} : update size`);
    const delta: UIElementSize = {
      height: newDimensions.height - componentHeight,
      width: newDimensions.width - componentWidth,
    };
    // console.log(`#### ${props.widgetName} : delta - ${delta.height}`);
    // Get the updated Widget rows and columns props
    // False, if there is collision
    // False, if none of the rows and cols have changed.
    const newRowCols: WidgetRowCols | false = computeFinalRowCols(
      delta,
      position,
      props,
    );
    // console.log("#### new row cols");
    // console.log(newRowCols);
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
      !isLastSelected &&
      parentWidgetToSelect?.widgetId !== props.widgetId &&
      selectWidget(props.widgetId);

    if (parentWidgetToSelect) {
      selectWidget &&
        !isParentWidgetSelected &&
        selectWidget(parentWidgetToSelect.widgetId);
      focusWidget(parentWidgetToSelect.widgetId);
    } else {
      selectWidget && !isLastSelected && selectWidget(props.widgetId);
    }
    // Property pane closes after a resize/drag
    showPropertyPane && showPropertyPane();
    AnalyticsUtil.logEvent("WIDGET_RESIZE_END", {
      widgetName: props.widgetName,
      widgetType: props.type,
      startHeight: componentHeight,
      startWidth: componentWidth,
      endHeight: newDimensions.height,
      endWidth: newDimensions.width,
    });
  };

  const handleResizeStart = () => {
    setIsResizing && !isResizing && setIsResizing(true);
    selectWidget && !isLastSelected && selectWidget(props.widgetId);
    // Make sure that this tableFilterPane should close
    showTableFilterPane && showTableFilterPane();
    AnalyticsUtil.logEvent("WIDGET_RESIZE_START", {
      widgetName: props.widgetName,
      widgetType: props.type,
    });
  };
  let disabledHorizontalHandles: string[] = [];
  if (
    props.useAutoLayout &&
    props.direction === LayoutDirection.Vertical &&
    props.responsiveBehavior === ResponsiveBehavior.Fill
  ) {
    disabledHorizontalHandles = [
      "left",
      "right",
      "bottomLeft",
      "bottomRight",
      "topLeft",
      "topRight",
    ];
  }
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
    let handlesToOmit = get(props, "disabledResizeHandles", []);
    // if (disabledResizeHandles && disabledResizeHandles.length)
    //   handlesToOmit = [...handlesToOmit, ...disabledResizeHandles];
    handlesToOmit = [...handlesToOmit, ...disabledHorizontalHandles];
    return omit(allHandles, handlesToOmit);
  }, [props, disabledHorizontalHandles]);

  const isEnabled: boolean =
    !isDragging &&
    isWidgetFocused &&
    !props.resizeDisabled &&
    !isSnipingMode &&
    !isPreviewMode;

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
      allowResize={!isMultiSelected}
      componentHeight={componentHeight}
      componentWidth={componentWidth}
      direction={props.direction}
      enable={isEnabled}
      getResizedPositions={getResizedPositions}
      gridProps={gridProps}
      handles={handles}
      isWrapper={props.isWrapper}
      onStart={handleResizeStart}
      onStop={updateSize}
      originalPositions={originalPositions}
      parentId={props.parentId}
      responsiveBehavior={props.responsiveBehavior}
      snapGrid={{ x: props.parentColumnSpace, y: props.parentRowSpace }}
      updateBottomRow={updateBottomRow}
      useAutoLayout={props.useAutoLayout}
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
