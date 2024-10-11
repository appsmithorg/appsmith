import type {
  AnvilHighlightInfo,
  DeriveHighlightsFn,
  DraggedWidget,
  GetDimensions,
  HighlightPayload,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { HIGHLIGHT_SIZE, defaultHighlightPayload } from "../../constants";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";
import { getRelativeDimensions } from "./dimensionUtils";
import {
  getNonDraggedWidgets,
  getStartPosition,
  performInitialChecks,
} from "./highlightUtils";

export interface RowMetaInformation {
  metaData: RowMetaData[][];
  tallestWidgets: WidgetLayoutProps[];
}

export interface RowMetaData extends WidgetLayoutProps, LayoutElementPosition {}

/**
 * @param layoutProps | LayoutProps
 * @param positions | LayoutElementPositions
 * @param canvasId | string
 * @param draggedWidgets | DraggedWidget[] : List of widgets that are being dragged
 * @param layoutOrder | string[] : Top - down hierarchy of layout IDs.
 * @param parentDropTarget | string : id of immediate drop target ancestor.
 * @returns HighlightPayload.
 */
export const deriveRowHighlights =
  (
    layoutProps: LayoutProps,
    canvasId: string,
    layoutOrder: string[],
    parentDropTarget: string,
  ) =>
  (
    positions: LayoutElementPositions,
    draggedWidgets: DraggedWidget[],
  ): HighlightPayload => {
    /**
     * Step 0: Perform initial checks before calculating highlights.
     * There are situations where highlight calculations are not required.
     */
    const res: HighlightPayload | undefined = performInitialChecks(
      layoutProps,
      positions,
      draggedWidgets,
    );

    if (res) return res;

    const { isDropTarget, layoutId, layoutStyle } = layoutProps;

    const parentDropTargetId: string = isDropTarget
      ? layoutId
      : parentDropTarget;

    const getDimensions: (id: string) => LayoutElementPosition =
      getRelativeDimensions(positions);

    const baseHighlight: AnvilHighlightInfo = {
      layoutId: layoutProps.layoutId,
      alignment:
        layoutStyle && layoutStyle["justifyContent"]
          ? (layoutStyle["justifyContent"] as FlexLayerAlignment)
          : FlexLayerAlignment.Start,
      canvasId,
      height: 0,
      isVertical: true,
      layoutOrder,
      posX: HIGHLIGHT_SIZE / 2,
      posY: HIGHLIGHT_SIZE / 2,
      rowIndex: 0,
      width: HIGHLIGHT_SIZE,
      edgeDetails: {
        top: false,
        bottom: false,
        left: false,
        right: false,
      },
    };

    // If layout is empty, add an initial highlight.
    if (!layoutProps.layout?.length) {
      return getInitialHighlights(layoutProps, baseHighlight, getDimensions);
    }

    // Check if layout renders widgets or layouts.
    const rendersWidgets: boolean = LayoutFactory.doesLayoutRenderWidgets(
      layoutProps.layoutType,
    );

    // It renders other layouts.
    if (!rendersWidgets) {
      return getHighlightsForLayoutRow(
        layoutProps,
        positions,
        baseHighlight,
        canvasId,
        draggedWidgets,
        layoutOrder,
        parentDropTargetId,
        getDimensions,
      );
    }

    return getHighlightsForWidgetsRow(
      layoutProps,
      baseHighlight,
      draggedWidgets,
      getDimensions,
    );
  };

/**
 * Derive highlights for a row of widgets.
 * 1. Derive meta information about the row.
 *  a. if it is flex wrapped.
 *  b. If yes, then how the widgets are positioned into multiple rows.
 * 2. Calculate highlights for each row of widgets.
 * @param layoutProps | LayoutProps
 * @param baseHighlight | AnvilHighlightInfo
 * @param draggedWidgets | DraggedWidget[] : List of dragged widgets.
 * @param getDimensions | GetDimensions : method to get relative dimensions of an entity.
 * @returns HighlightPayload.
 */
export function getHighlightsForWidgetsRow(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
): HighlightPayload {
  // Get widget data
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  // Extract meta information about row.
  const meta: RowMetaInformation = extractMetaInformation(
    layout,
    getDimensions,
  );

  const nonDraggedWidgets: WidgetLayoutProps[] = getNonDraggedWidgets(
    layout,
    draggedWidgets,
  );

  /**
   * If layout is empty after discarding dragged widgets,
   * then it should be skipped.
   */
  if (!nonDraggedWidgets.length && !layoutProps.isDropTarget)
    return { ...defaultHighlightPayload, skipEntity: true };

  // add a highlight before every widget and after the last one.
  const highlights: AnvilHighlightInfo[] = [];

  meta.metaData.forEach((row: RowMetaData[], index: number) => {
    highlights.push(
      ...getHighlightsForRow(
        row,
        meta.tallestWidgets[index],
        layoutProps,
        baseHighlight,
        draggedWidgets,
        getDimensions,
        highlights.length ? highlights[highlights.length - 1].rowIndex : 0, // Start subsequent wrapped row with the same index as the last index of the previous row.
      ),
    );
  });

  return { highlights, skipEntity: false };
}

/**
 * Compute highlights for a row.
 * @param row | RowMetaData[] : Meta data on all widgets in the current row.
 * @param tallestWidget | WidgetLayoutProps : tallest widget in the current row.
 * @param layoutProps | LayoutProps : Properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : Default highlight.
 * @param draggedWidgets | string[] : List of dragged widgets.
 * @param getDimensions | GetDimensions : method to get relative dimensions of an entity.
 * @param startingIndex | number : Starting index for the first highlight.
 * @returns AnvilHighlightInfo[]
 */
export function getHighlightsForRow(
  row: RowMetaData[],
  tallestWidget: WidgetLayoutProps,
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
  startingIndex = 0,
): AnvilHighlightInfo[] {
  let highlights: AnvilHighlightInfo[] = [];
  let index = 0;
  const draggedWidgetIndices: number[] = [];
  const tallestDimension = getDimensions(tallestWidget.widgetId);

  const layoutDimensions: LayoutElementPosition = getDimensions(
    layoutProps.layoutId,
  );

  // Iterate through each widget in the row
  while (index < row.length) {
    const { widgetId } = row[index];
    const isDraggedWidget: boolean = draggedWidgets.some(
      (widget: DraggedWidget) => widget.widgetId === widgetId,
    );

    // Get dimensions of the previous widget
    const prevWidgetDimensions: LayoutElementPosition | undefined =
      index === 0 ? undefined : row[index - 1];
    const skipWidgetHighlight = draggedWidgetIndices.includes(index - 1);

    // Update highlights based on the widget's position and properties
    highlights = updateHighlights(
      highlights,
      isDraggedWidget || skipWidgetHighlight
        ? { ...baseHighlight, existingPositionHighlight: true }
        : baseHighlight,
      layoutDimensions,
      row[index],
      prevWidgetDimensions,
      tallestDimension,
      index + startingIndex - draggedWidgetIndices.length,
      false,
    );

    // Track indices of dragged widgets
    if (isDraggedWidget) {
      draggedWidgetIndices.push(index);
    }

    index += 1;

    // Handle the last widget in the row that is not dragged
    if (index === row.length && !isDraggedWidget) {
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimensions,
        row[index - 1],
        prevWidgetDimensions,
        tallestDimension,
        index + startingIndex - draggedWidgetIndices.length,
        true,
      );
      break;
    }
  }

  // Return the generated highlights for the row
  return highlights;
}

/**
 * Extract meta information about a row of widgets.
 * If row is flex wrapped, then find out which widgets are placed in each subsequent row.
 * Also, identify the tallest widget in each row.
 * @param layout | WidgetLayoutProps[] : list of widget ids
 * @param getDimensions | GetDimensions : function to get relative dimensions of a widget.
 * @returns RowMetaInformation
 */
export function extractMetaInformation(
  layout: WidgetLayoutProps[],
  getDimensions: GetDimensions,
): RowMetaInformation {
  const data: RowMetaData[][] = [];
  const tallestWidgets: WidgetLayoutProps[] = [];
  let curr: RowMetaData[] = [];
  let currentTallestWidget: WidgetLayoutProps = layout[0];
  let maxHeight = 0;

  for (const each of layout) {
    const dimensions: LayoutElementPosition = getDimensions(each.widgetId);

    if (!dimensions) continue;

    const { height, top } = dimensions;

    // If current row is empty, add the widget to it.
    if (!curr.length) {
      curr.push({ ...each, ...dimensions });
      // set maxHeight of current row equal to height of the first widget in the row.
      maxHeight = height;
      currentTallestWidget = each;
      // else check if there is intersection with the last widget in the current row.
    } else if (
      checkIntersection(
        [top, top + height],
        [
          curr[curr.length - 1].top,
          curr[curr.length - 1].top + curr[curr.length - 1].height,
        ],
      )
    ) {
      // If there is intersection, add the widget to the current row.
      curr.push({ ...each, ...dimensions });

      if (height > maxHeight) {
        maxHeight = height;
        currentTallestWidget = each;
      }
      // else start a new row.
    } else {
      // Add the current row to the data.
      data.push(curr);
      // Add the tallest widgets to the tallest widgets array.
      tallestWidgets.push(currentTallestWidget);
      // Reset the current row.
      curr = [{ ...each, ...dimensions }];
      // Reset the max height.
      maxHeight = height;
      currentTallestWidget = each;
    }
  }

  if (curr.length) {
    data.push(curr);
    tallestWidgets.push(currentTallestWidget);
  }

  return { metaData: data, tallestWidgets };
}

export function checkIntersection(a: number[], b: number[]): boolean {
  return (
    parseFloat(a[0].toFixed(2)) < parseFloat(b[1].toFixed(2)) &&
    parseFloat(b[0].toFixed(2)) < parseFloat(a[1].toFixed(2))
  );
}

/**
 * This layout renders more layouts.
 * Calculate highlights for each child layout and combine them together.
 * @param layoutProps | LayoutProps
 * @param positions | LayoutElementPositions
 * @param baseHighlight | AnvilHighlightInfo
 * @param canvasId | string
 * @param layoutOrder |string[] : Top - down hierarchy of parent layouts.
 * @param parentDropTargetId | string : Id of immediate drop target ancestor.
 * @param getDimensions | GetDimensions : method to get relative dimensions of an entity.
 * @returns HighlightPayload.
 */
export function getHighlightsForLayoutRow(
  layoutProps: LayoutProps,
  positions: LayoutElementPositions,
  baseHighlight: AnvilHighlightInfo,
  canvasId: string,
  draggedWidgets: DraggedWidget[],
  layoutOrder: string[],
  parentDropTargetId: string,
  getDimensions: GetDimensions,
): HighlightPayload {
  let highlights: AnvilHighlightInfo[] = [];
  const layout: LayoutProps[] = layoutProps.layout as LayoutProps[];

  let index = 0;
  let discardedLayouts: number = 0;
  let skipNextNewCellHighlights = false;

  // Loop over each child layout
  while (index < layout.length) {
    // Extract information on current child layout.
    const { isDropTarget, layoutId, layoutType } = layout[index];

    const prevLayoutDimensions: LayoutElementPosition | undefined =
      index === 0 ? undefined : getDimensions(layout[index - 1]?.layoutId);

    const layoutDimension: LayoutElementPosition = getDimensions(
      layoutProps.layoutId,
    );

    const currentDimension: LayoutElementPosition = getDimensions(layoutId);

    // Get the deriveHighlights function for the child layout.
    const deriveHighlightsFn: DeriveHighlightsFn =
      LayoutFactory.getDeriveHighlightsFn(layoutType);
    // Calculate highlights for the layout component.
    const { highlights: layoutHighlights, skipEntity }: HighlightPayload =
      deriveHighlightsFn(
        layout[index],
        canvasId,
        [...layoutOrder, layout[index].layoutId],
        parentDropTargetId,
      )(positions, draggedWidgets);

    if (!skipNextNewCellHighlights) {
      /**
       * Add a highlight for the drop zone above the child layout.
       * This is done only if the child layout has highlights.
       * If it doesn't, that means that the layout is empty after excluding the dragged widgets
       * and can be avoided.
       */
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimension,
        currentDimension,
        prevLayoutDimensions,
        undefined,
        index,
        false,
      );
    } else {
      skipNextNewCellHighlights = false;
    }

    /**
     * Add highlights of the child layout if it is not a drop target.
     * because if it is, then it can handle its own drag behavior.
     */
    if (!isDropTarget && layoutHighlights.length) {
      highlights.push(...layoutHighlights);
    }

    if (skipEntity) {
      /**
       * Layout is discarded from child count only if skipEntity is true.
       * skipEntity === true => dragged widget or empty layout after discarding dragged widgets.
       * skipEntity === false => dragged widgets include blacklisted widgets or maxChildLimit is reached.
       */
      skipNextNewCellHighlights = true;
      discardedLayouts += 1;
    }

    index += 1;

    if (index === layout.length && !skipEntity) {
      // Add a highlight for the drop zone below the child layout.
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimension,
        currentDimension,
        prevLayoutDimensions,
        undefined,
        index - discardedLayouts,
        true,
      );
    }
  }

  return { highlights, skipEntity: false };
}

function updateHighlights(
  arr: AnvilHighlightInfo[],
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: LayoutElementPosition,
  currDimension: LayoutElementPosition,
  prevDimension: LayoutElementPosition | undefined,
  tallestWidget: LayoutElementPosition | undefined,
  rowIndex: number,
  isFinalHighlight: boolean,
): AnvilHighlightInfo[] {
  const updatedHighlights: AnvilHighlightInfo[] = arr;
  let prevHighlightIndex = -1;
  const prevHighlights: AnvilHighlightInfo[] | undefined = arr.length
    ? arr.filter((each: AnvilHighlightInfo, index: number) => {
        if (each.rowIndex === rowIndex - 1 && each.isVertical) {
          if (prevHighlightIndex === -1) prevHighlightIndex = index;

          return true;
        }
      })
    : undefined;

  const curr: AnvilHighlightInfo = generateHighlights(
    baseHighlight,
    layoutDimension,
    currDimension,
    prevDimension,
    tallestWidget,
    rowIndex,
    isFinalHighlight,
  );

  if (prevHighlights?.length) {
    updatedHighlights[prevHighlightIndex] = {
      ...prevHighlights[0],
    };
  }

  updatedHighlights.push(curr);

  return updatedHighlights;
}

export function generateHighlights(
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: LayoutElementPosition,
  currentDimension: LayoutElementPosition,
  prevDimension: LayoutElementPosition | undefined,
  tallestDimension: LayoutElementPosition | undefined,
  rowIndex: number,
  isLastHighlight: boolean,
): AnvilHighlightInfo {
  const isInitialHighlight: boolean = rowIndex === 0;
  let posX = 0;

  if (isLastHighlight) {
    if (isInitialHighlight) {
      posX = currentDimension.left;
    } else {
      const gap: number = Math.max(
        layoutDimension.left +
          layoutDimension.width -
          currentDimension.left -
          currentDimension.width,
        0,
      );
      const pos: number =
        layoutDimension.left +
        layoutDimension.width -
        gap / 2 -
        HIGHLIGHT_SIZE / 2;

      posX = Math.min(
        currentDimension.left + currentDimension.width, // To the right of last child.
        pos, // In the middle of the gap between the last child and the right edge of the layout.
        layoutDimension.left + layoutDimension.width - HIGHLIGHT_SIZE, // along the right edge of the layout.
      );
    }
  } else {
    const gap: number = prevDimension
      ? currentDimension.left - (prevDimension.left + prevDimension.width)
      : HIGHLIGHT_SIZE;

    posX = Math.max(
      currentDimension.left - gap / 2 - HIGHLIGHT_SIZE / 2,
      layoutDimension.left,
    );
  }

  const posY = tallestDimension?.top ?? layoutDimension.top;

  return {
    ...baseHighlight,
    height: tallestDimension?.height ?? layoutDimension.height,
    posX,
    posY,
    rowIndex,
    edgeDetails: {
      top: posY === layoutDimension.top,
      bottom: posY === layoutDimension.top + layoutDimension.height,
      left: posX === layoutDimension.left,
      right:
        posX + HIGHLIGHT_SIZE === layoutDimension.left + layoutDimension.width,
    },
  };
}

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param isDropTarget | boolean
 * @returns HighlightPayload
 */
export function getInitialHighlights(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  getDimensions: GetDimensions,
): HighlightPayload {
  const { layoutId } = layoutProps;

  const layoutDimension: LayoutElementPosition = getDimensions(layoutId);

  const posX: number = getStartPosition(
    baseHighlight.alignment,
    layoutDimension.width,
  );

  return {
    highlights: updateHighlights(
      [],
      baseHighlight,
      layoutDimension,
      { ...layoutDimension, left: posX, width: HIGHLIGHT_SIZE },
      undefined,
      undefined,
      0,
      true,
    ),
    skipEntity: false,
  };
}
