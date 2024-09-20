import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  AnvilHighlightInfo,
  DeriveHighlightsFn,
  DraggedWidget,
  GetDimensions,
  HighlightPayload,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { getStartPosition } from "./highlightUtils";
import {
  DEFAULT_VERTICAL_HIGHLIGHT_HEIGHT,
  HIGHLIGHT_SIZE,
} from "../../constants";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";

/**
 *
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param draggedWidgets | string[] : list of widgets that are being dragged.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param hasAlignments | boolean | whether the layout is aligned.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns HighlightPayload.
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
  hasAlignments: boolean,
  hasFillWidget = false,
): HighlightPayload {
  let highlights: AnvilHighlightInfo[] = [];

  // Extract list of child widgets
  const layout: WidgetLayoutProps[] = layoutProps.layout as WidgetLayoutProps[];

  // Parent layout dimensions
  const layoutDimensions: LayoutElementPosition = getDimensions(
    layoutProps.layoutId,
  );

  let index = 0;
  let draggedChildCount = 0;

  // Loop over all child widgets
  while (index < layout.length) {
    const widgetId: string = layout[index].widgetId;

    // Check if current widget is included in the dragged widgets.
    const isDraggedWidget: boolean = draggedWidgets.some(
      (widget: DraggedWidget) => widget.widgetId === widgetId,
    );

    // Dimensions of current child widget.
    const currentWidgetDimension: LayoutElementPosition =
      getDimensions(widgetId);

    // Dimensions of next widget
    const nextWidgetDimension: LayoutElementPosition | undefined =
      index === layout.length - 1
        ? undefined
        : getDimensions(layout[index + 1]?.widgetId);
    const prevWidgetDimension: LayoutElementPosition | undefined =
      index === 0 ? undefined : getDimensions(layout[index - 1]?.widgetId);

    // If the widget is dragged, don't add a highlight for it.
    if (!isDraggedWidget) {
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimensions,
        currentWidgetDimension,
        nextWidgetDimension,
        prevWidgetDimension,
        index - draggedChildCount,
        false,
        hasAlignments,
        hasFillWidget,
      );
    } else draggedChildCount += 1; // Update the dragged widget count.

    index += 1;

    // Add a highlight after the last widget.
    if (index === layout.length) {
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimensions,
        currentWidgetDimension,
        nextWidgetDimension,
        prevWidgetDimension,
        index - draggedChildCount,
        true,
        hasAlignments,
        hasFillWidget,
      );
    }
  }

  return { highlights, skipEntity: false };
}

const markDraggedHugWidgetHighlights = (
  highlights: AnvilHighlightInfo[],
  layoutId: string,
  currentLayout: LayoutProps,
  draggedWidgets: DraggedWidget[],
) => {
  // If the layout is empty and does not have any fill widgets that are dragged,
  // make sure the highlights of dragged widgets have existingPositionHighlight set to true.
  const draggedWidgetsAlignment = draggedWidgets.map((widget) => {
    const layoutProps = (currentLayout.layout as WidgetLayoutProps[]).find(
      (layout) => layout.widgetId === widget.widgetId,
    );

    return layoutProps?.alignment;
  });
  const checkIfAllDraggedWidgetsAlignmentAreSame =
    draggedWidgetsAlignment.every(
      (alignment) => alignment === draggedWidgetsAlignment[0],
    );

  if (checkIfAllDraggedWidgetsAlignmentAreSame) {
    highlights.forEach((highlight) => {
      if (
        highlight.layoutId === layoutId &&
        draggedWidgetsAlignment.includes(highlight.alignment)
      ) {
        highlight.existingPositionHighlight = true;
      }
    });
  }
};

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param widgetPositions | WidgetPositions : positions and dimensions of widgets and layouts.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param draggedWidgets | string[] : list of widgets that are being dragged.
 * @param canvasId | string : widgetId of parent canvas widget.
 * @param layoutOrder | string[] : Hierarchy (Top - down) of layouts.
 * @param parentDropTargetId | string : id of immediate drop target ancestor.
 * @param getDimensions | GetDimensions : method to get dimensions of a widget.
 * @param hasAlignments | boolean | whether the layout is aligned.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns HighlightPayload
 */
export function getHighlightsForLayouts(
  layoutProps: LayoutProps,
  widgetPositions: LayoutElementPositions,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  canvasId: string,
  layoutOrder: string[],
  parentDropTargetId: string,
  getDimensions: GetDimensions,
  hasAlignments: boolean,
  hasFillWidget = false,
): HighlightPayload {
  let highlights: AnvilHighlightInfo[] = [];
  // Extract list of child layouts.
  const layouts: LayoutProps[] = layoutProps.layout as LayoutProps[];
  // Dimensions of parent layout.
  const layoutDimension: LayoutElementPosition = getDimensions(
    layoutProps.layoutId,
  );

  let index = 0;
  const discardedLayoutIndices: number[] = [];

  // Loop over all child layouts.
  while (index < layouts.length) {
    // Extract information on current child layout.
    const { isDropTarget, layoutId, layoutType } = layouts[index];

    // Dimensions of current child layout.
    const currentDimension: LayoutElementPosition = getDimensions(layoutId);

    // Dimensions of neighboring layouts
    const nextLayoutDimensions: LayoutElementPosition | undefined =
      index === layouts.length - 1
        ? undefined
        : getDimensions(layouts[index + 1]?.layoutId);
    const prevLayoutDimensions: LayoutElementPosition | undefined =
      index === 0 ? undefined : getDimensions(layouts[index - 1]?.layoutId);

    // Get the deriveHighlights function for the child layout.
    const deriveHighlightsFn: DeriveHighlightsFn =
      LayoutFactory.getDeriveHighlightsFn(layoutType);
    const currentLayout = layouts[index];
    // Calculate highlights for the layout component.
    const { highlights: layoutHighlights, skipEntity }: HighlightPayload =
      deriveHighlightsFn(
        currentLayout,
        canvasId,
        [...layoutOrder, currentLayout.layoutId],
        parentDropTargetId,
      )(widgetPositions, draggedWidgets);
    const isPreviousLayoutDiscarded = discardedLayoutIndices.includes(
      index - 1,
    );

    if (!isPreviousLayoutDiscarded) {
      /**
       * Add a highlight for the drop zone above the child layout.
       * This is done only if the child layout has highlights.
       * If it doesn't, that means that the layout is empty after excluding the dragged widgets
       * and can be avoided.
       */
      const updatedHighlights = updateHighlights(
        highlights,
        skipEntity
          ? {
              ...baseHighlight,
              layoutId,
              existingPositionHighlight: hasFillWidget,
            }
          : baseHighlight,
        layoutDimension,
        currentDimension,
        nextLayoutDimensions,
        prevLayoutDimensions,
        index,
        false,
        hasAlignments,
        hasFillWidget,
        skipEntity,
      );

      if (skipEntity && !hasFillWidget) {
        markDraggedHugWidgetHighlights(
          updatedHighlights,
          layoutId,
          currentLayout,
          draggedWidgets,
        );
      }

      highlights = updatedHighlights;
    }

    if (skipEntity) {
      /**
       * Layout is discarded from child count only if skipEntity is true.
       * skipEntity === true => dragged widget or empty layout after discarding dragged widgets.
       * skipEntity === false => dragged widgets include blacklisted widgets or maxChildLimit is reached.
       */
      discardedLayoutIndices.push(index);
    }

    /**
     * Add highlights of the child layout if it is not a drop target.
     * because if it is, then it can handle its own drag behavior.
     */
    if (!isDropTarget && layoutHighlights.length) {
      highlights.push(...layoutHighlights);
    }

    index += 1;
    const isLastLayout = index === layouts.length;

    if (!skipEntity && isLastLayout) {
      // Add a highlight for the drop zone below the child layout.
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimension,
        currentDimension,
        nextLayoutDimensions,
        prevLayoutDimensions,
        index - discardedLayoutIndices.length,
        true,
        hasAlignments,
        hasFillWidget,
      );
    }
  }

  return { highlights, skipEntity: false };
}

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param hasAlignments | boolean : whether the layout is aligned.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns HighlightPayload : list of highlights.
 */
export function getInitialHighlights(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  getDimensions: GetDimensions,
  isDropTarget: boolean,
  hasAlignments: boolean,
  hasFillWidget = false,
): HighlightPayload {
  const { layoutId } = layoutProps;
  const layoutDimension: LayoutElementPosition = getDimensions(layoutId);

  // Get start position of the highlight along the y axis based on layoutAlignment.
  const posY: number =
    layoutDimension.top +
    getStartPosition(baseHighlight.alignment, layoutDimension.height);

  return {
    highlights: updateHighlights(
      [],
      baseHighlight,
      layoutDimension,
      { ...layoutDimension, height: HIGHLIGHT_SIZE, top: posY },
      undefined,
      undefined,
      0,
      true,
      hasAlignments,
      hasFillWidget,
      true,
      true,
    ),
    skipEntity: false,
  };
}

/**
 *
 * @param arr | AnvilHighlightInfo[] : List of highlights.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param layoutDimension | LayoutElementPosition : Dimension of the layout.
 * @param currDimension | LayoutElementPosition : Dimension of the current widget or layout.
 * @param nextDimension | LayoutElementPosition | undefined : Dimension of the next widget or layout.
 * @param rowIndex | number : Index of the current entity in the layout.
 * @param isLastHighlight | boolean
 * @param hasAlignments | boolean
 * @param hasFillWidget | boolean
 * @returns AnvilHighlightInfo[] : Updated list of highlights after adding the highlights for current entity.
 */
export function updateHighlights(
  arr: AnvilHighlightInfo[],
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: LayoutElementPosition,
  currDimension: LayoutElementPosition,
  nextDimension: LayoutElementPosition | undefined,
  prevDimension: LayoutElementPosition | undefined,
  rowIndex: number,
  isLastHighlight: boolean,
  hasAlignments: boolean,
  hasFillWidget?: boolean,
  isCurrentLayoutEmpty = false,
  isInitialHighlight = false,
): AnvilHighlightInfo[] {
  let updatedHighlights: AnvilHighlightInfo[] = arr;

  /**
   * Fetch last set of horizontal highlights.
   * Drop zone of this set needs to be updated after the current highlights have been calculated.
   */
  let prevHighlightsIndex = -1;
  const prevHighlights: AnvilHighlightInfo[] | undefined = arr.length
    ? arr.filter((each: AnvilHighlightInfo, index: number) => {
        if (each.rowIndex === rowIndex - 1 && !each.isVertical) {
          if (prevHighlightsIndex === -1) prevHighlightsIndex = index;

          return true;
        }
      })
    : undefined;

  /**
   * Calculate current batch of highlights.
   */
  const curr: AnvilHighlightInfo[] = generateHighlights(
    baseHighlight,
    layoutDimension,
    currDimension,
    prevDimension,
    rowIndex,
    isLastHighlight,
    hasAlignments,
    hasFillWidget,
    isCurrentLayoutEmpty,
    isInitialHighlight,
  );

  /**
   * If previous highlights exist,
   * then update their bottom drop zone to match the top drop zone of current highlights.
   */
  if (prevHighlights) {
    updatedHighlights = [
      ...updatedHighlights.slice(0, prevHighlightsIndex),
      ...prevHighlights,
      ...updatedHighlights.slice(prevHighlightsIndex + prevHighlights.length),
    ];
  }

  updatedHighlights.push(...curr);

  return updatedHighlights;
}

export function generateHighlights(
  baseHighlight: AnvilHighlightInfo,
  layoutDimension: LayoutElementPosition,
  currentDimension: LayoutElementPosition,
  prevDimension: LayoutElementPosition | undefined,
  rowIndex: number,
  isLastHighlight: boolean,
  hasAlignments: boolean,
  hasFillWidget = false,
  isCurrentLayoutEmpty = false,
  isInitialHighlight = false,
): AnvilHighlightInfo[] {
  const renderHorizontalHighlights = hasFillWidget || !hasAlignments;
  /**
   * If dragged widgets include a Fill widget,
   * then show a single highlight with start alignment.
   */
  const arr = renderHorizontalHighlights
    ? [FlexLayerAlignment.Start]
    : [
        FlexLayerAlignment.Start,
        FlexLayerAlignment.Center,
        FlexLayerAlignment.End,
      ];
  /**
   * For fill widget => single highlight spanning the total width.
   * For hug widget => 3 highlights, one for each alignment. width / 3.
   */
  const width: number = layoutDimension.width / arr.length;

  const isFirstHighlight: boolean = rowIndex === 0;
  let posY = 0;
  const emptyLayout = isFirstHighlight && isLastHighlight;
  let gap = 0;

  switch (true) {
    case emptyLayout:
    case isFirstHighlight:
      posY = Math.max(currentDimension.top - layoutDimension.top, 0);
      break;
    case isLastHighlight:
      gap =
        layoutDimension.top +
        layoutDimension.height -
        currentDimension.top -
        currentDimension.height;
      posY = Math.min(
        currentDimension.top + currentDimension.height, // Below the last child.
        layoutDimension.top +
          layoutDimension.height -
          gap / 2 -
          HIGHLIGHT_SIZE / 2, // In the middle of the gap between the last child and the bottom edge of the layout.
        layoutDimension.top + layoutDimension.height - HIGHLIGHT_SIZE, // Along the bottom edge of the layout.
      );
      break;
    default:
      gap =
        prevDimension && !isCurrentLayoutEmpty
          ? currentDimension.top - (prevDimension.top + prevDimension.height)
          : 0;
      posY = Math.max(
        currentDimension.top - gap / 2 - HIGHLIGHT_SIZE / 2,
        HIGHLIGHT_SIZE / 2,
      );
      break;
  }

  return arr.map((alignment: FlexLayerAlignment, index: number) => ({
    ...baseHighlight,
    alignment,
    posX: width * index,
    posY,
    rowIndex,
    width,
    edgeDetails: {
      top: isFirstHighlight,
      bottom: isLastHighlight,
      left: width * index === 0,
      right: width * (index + 1) === layoutDimension.width,
    },
    // For consistency, the root highlight should be horizontal and use the usual settings
    ...(baseHighlight.canvasId !== "0" && isCurrentLayoutEmpty && !hasFillWidget
      ? {
          isVertical: true,
          height: isInitialHighlight
            ? Math.min(
                DEFAULT_VERTICAL_HIGHLIGHT_HEIGHT,
                layoutDimension.height,
              )
            : currentDimension.height,
          width: HIGHLIGHT_SIZE,
          posX: ((layoutDimension.width - HIGHLIGHT_SIZE) * index) / 2,
          posY: isFirstHighlight ? 0 : posY + HIGHLIGHT_SIZE / 2,
        }
      : {}),
  }));
}
