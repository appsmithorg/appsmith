import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  AnvilHighlightInfo,
  DeriveHighlightsFn,
  DraggedWidget,
  GetDimensions,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { getStartPosition } from "./highlightUtils";
import { HIGHLIGHT_SIZE, VERTICAL_DROP_ZONE_MULTIPLIER } from "../../constants";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";
import { FlexLayerAlignment } from "layoutSystems/common/utils/constants";
import type { DropZone } from "layoutSystems/common/utils/types";

/**
 *
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param draggedWidgets | string[] : list of widgets that are being dragged.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param hasAlignments | boolean | whether the layout is aligned.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[] : List of highlights.
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  getDimensions: GetDimensions,
  hasAlignments: boolean,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
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

    // If the widget is dragged, don't add a highlight for it.
    if (!isDraggedWidget) {
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimensions,
        currentWidgetDimension,
        nextWidgetDimension,
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
        index - draggedChildCount,
        true,
        hasAlignments,
        hasFillWidget,
      );
    }
  }

  return highlights;
}

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
 * @returns AnvilHighlightInfo[] : list of highlights.
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
): AnvilHighlightInfo[] {
  let highlights: AnvilHighlightInfo[] = [];
  // Extract list of child layouts.
  const layouts: LayoutProps[] = layoutProps.layout as LayoutProps[];
  // Dimensions of parent layout.
  const layoutDimension: LayoutElementPosition = getDimensions(
    layoutProps.layoutId,
  );

  let index = 0;
  let discardedLayouts: number = 0;
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

    // Get the deriveHighlights function for the child layout.
    const deriveHighlightsFn: DeriveHighlightsFn =
      LayoutFactory.getDeriveHighlightsFn(layoutType);

    // Calculate highlights for the layout component.
    const layoutHighlights: AnvilHighlightInfo[] = deriveHighlightsFn(
      layouts[index],
      canvasId,
      [...layoutOrder, layouts[index].layoutId],
      parentDropTargetId,
    )(widgetPositions, draggedWidgets);

    if (layoutHighlights.length) {
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
        nextLayoutDimensions,
        index - discardedLayouts,
        false,
        hasAlignments,
        hasFillWidget,
      );

      /**
       * Add highlights of the child layout if it is not a drop target.
       * because if it is, then it can handle its own drag behavior.
       */
      if (!isDropTarget) {
        highlights.push(...layoutHighlights);
      }
    } else discardedLayouts += 1;

    index += 1;

    if (index === layouts.length) {
      // Add a highlight for the drop zone below the child layout.
      highlights = updateHighlights(
        highlights,
        baseHighlight,
        layoutDimension,
        currentDimension,
        nextLayoutDimensions,
        index - discardedLayouts,
        true,
        hasAlignments,
        hasFillWidget,
      );
    }
  }

  return highlights;
}

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param hasAlignments | boolean : whether the layout is aligned.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[] : list of highlights.
 */
export function getInitialHighlights(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  getDimensions: GetDimensions,
  isDropTarget: boolean,
  hasAlignments: boolean,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  const { layoutId } = layoutProps;
  const layoutDimension: LayoutElementPosition = getDimensions(layoutId);

  // Get start position of the highlight along the y axis based on layoutAlignment.
  const posY: number =
    layoutDimension.top +
    getStartPosition(baseHighlight.alignment, layoutDimension.height);

  return updateHighlights(
    [],
    baseHighlight,
    layoutDimension,
    { ...layoutDimension, height: HIGHLIGHT_SIZE, top: posY },
    undefined,
    0,
    true,
    hasAlignments,
    hasFillWidget,
  );
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
  rowIndex: number,
  isLastHighlight: boolean,
  hasAlignments: boolean,
  hasFillWidget?: boolean,
): AnvilHighlightInfo[] {
  let updatedHighlights: AnvilHighlightInfo[] = arr;

  /**
   * Fetch last set of horizontal highlights.
   * Drop zone of this set needs to be updated after the current highlights have been calculated.
   */
  let prevHighlightsIndex = -1;
  let prevHighlights: AnvilHighlightInfo[] | undefined = arr.length
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
    nextDimension,
    rowIndex,
    isLastHighlight,
    hasAlignments,
    prevHighlights && prevHighlights.length ? prevHighlights[0] : undefined,
    hasFillWidget,
  );
  /**
   * If previous highlights exist,
   * then update their bottom drop zone to match the top drop zone of current highlights.
   */
  if (prevHighlights) {
    prevHighlights = prevHighlights.map((each: AnvilHighlightInfo) => {
      return {
        ...each,
        dropZone: { ...each.dropZone, bottom: curr[0].dropZone.top },
      };
    });
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
  nextDimension: LayoutElementPosition | undefined,
  rowIndex: number,
  isLastHighlight: boolean,
  hasAlignments: boolean,
  prevHighlight?: AnvilHighlightInfo,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  /**
   * If dragged widgets include a Fill widget,
   * then show a single highlight with start alignment.
   */
  const arr =
    hasFillWidget || !hasAlignments
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

  const isInitialHighlight: boolean = rowIndex === 0;

  let posY = 0;
  if (isLastHighlight) {
    if (isInitialHighlight) {
      // Position values are relative to the MainCanvas. Hence it is important to deduct parent's position from widget's to get a position that is relative to the parent widget.
      posY = Math.max(currentDimension.top - layoutDimension.top, 0);
    } else {
      posY = Math.min(
        currentDimension.top -
          layoutDimension.top +
          currentDimension.height +
          HIGHLIGHT_SIZE / 2,
        layoutDimension.height - HIGHLIGHT_SIZE,
      );
    }
  } else {
    posY = Math.max(
      currentDimension.top - layoutDimension.top - HIGHLIGHT_SIZE,
      HIGHLIGHT_SIZE / 2,
    );
  }

  const dropZone: DropZone = {
    top: prevHighlight
      ? (posY - prevHighlight.posY) * VERTICAL_DROP_ZONE_MULTIPLIER
      : Math.max(posY - layoutDimension.top, HIGHLIGHT_SIZE),
    bottom: isLastHighlight
      ? Math.max(layoutDimension.height - posY, HIGHLIGHT_SIZE)
      : nextDimension
      ? Math.max(
          nextDimension.top + nextDimension.height - posY,
          HIGHLIGHT_SIZE,
        )
      : HIGHLIGHT_SIZE,
  };

  return arr.map((alignment: FlexLayerAlignment, index: number) => ({
    ...baseHighlight,
    alignment,
    dropZone,
    posX: width * index,
    posY,
    rowIndex,
    width,
  }));
}
