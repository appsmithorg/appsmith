import LayoutFactory from "layoutSystems/anvil/layoutComponents/LayoutFactory";
import type {
  AnvilHighlightInfo,
  DeriveHighlightsFn,
  DraggedWidget,
  GenerateHighlights,
  GetDimensions,
  LayoutProps,
  WidgetLayoutProps,
} from "../../anvilTypes";
import { getStartPosition } from "./highlightUtils";
import { HIGHLIGHT_SIZE } from "../../constants";
import type {
  LayoutElementPosition,
  LayoutElementPositions,
} from "layoutSystems/common/types";

/**
 *
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param draggedWidgets | string[] : list of widgets that are being dragged.
 * @param generateHighlights | GenerateHighlights : method of generate highlights for the parent layout.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[] : List of highlights.
 */
export function getHighlightsForWidgets(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  draggedWidgets: DraggedWidget[],
  generateHighlights: GenerateHighlights,
  getDimensions: GetDimensions,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];

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

    // Dimensions of neighboring widgets
    const nextWidgetDimension: LayoutElementPosition | undefined =
      index === layout.length - 1
        ? undefined
        : getDimensions(layout[index + 1]?.widgetId);
    const previousWidgetDimension: LayoutElementPosition | undefined =
      index === 0 ? undefined : getDimensions(layout[index - 1]?.widgetId);

    // If the widget is dragged, don't add a highlight for it.
    if (!isDraggedWidget) {
      highlights.push(
        ...generateHighlights(
          baseHighlight,
          layoutDimensions,
          currentWidgetDimension,
          previousWidgetDimension,
          nextWidgetDimension,
          index - draggedChildCount,
          false,
          hasFillWidget,
        ),
      );
    } else draggedChildCount += 1; // Update the dragged widget count.

    index += 1;

    // Add a highlight after the last widget.
    if (index === layout.length) {
      highlights.push(
        ...generateHighlights(
          baseHighlight,
          layoutDimensions,
          currentWidgetDimension,
          previousWidgetDimension,
          nextWidgetDimension,
          index - draggedChildCount,
          true,
          hasFillWidget,
        ),
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
 * @param generateHighlights | GenerateHighlights : method to generate highlights for the parent layout.
 * @param getDimensions | GetDimensions : method to get dimensions of a widget.
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
  generateHighlights: GenerateHighlights,
  getDimensions: GetDimensions,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  const highlights: AnvilHighlightInfo[] = [];
  // Extract list of child layouts.
  const layouts: LayoutProps[] = layoutProps.layout as LayoutProps[];
  // Dimensions of parent layout.
  const layoutDimension: LayoutElementPosition = getDimensions(
    layoutProps.layoutId,
  );

  let index = 0;

  // Loop over all child layouts.
  while (index < layouts.length) {
    // Extract information on current child layout.
    const { isDropTarget, layoutId, layoutType } = layouts[index];

    // Dimensions of current child layout.
    const currentDimension: LayoutElementPosition = getDimensions(layoutId);

    // Dimensions of neighboring layouts
    const prevLayoutDimensions: LayoutElementPosition | undefined =
      index === 0 ? undefined : getDimensions(layouts[index - 1]?.layoutId);
    const nextLayoutDimensions: LayoutElementPosition | undefined =
      index === layouts.length - 1
        ? undefined
        : getDimensions(layouts[index + 1]?.layoutId);

    // Add a highlight for the drop zone above the child layout.
    highlights.push(
      ...generateHighlights(
        baseHighlight,
        layoutDimension,
        currentDimension,
        prevLayoutDimensions,
        nextLayoutDimensions,
        index,
        false,
        hasFillWidget,
      ),
    );

    /**
     * Add highlights of the child layout if it is not a drop target.
     * because if it is, then it can handle its own drag behavior.
     */
    if (!isDropTarget) {
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

      highlights.push(...layoutHighlights);
    }

    index += 1;

    if (index === layouts.length) {
      // Add a highlight for the drop zone below the child layout.
      highlights.push(
        ...generateHighlights(
          baseHighlight,
          layoutDimension,
          currentDimension,
          prevLayoutDimensions,
          nextLayoutDimensions,
          index,
          true,
          hasFillWidget,
        ),
      );
    }
  }

  return highlights;
}

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param generateHighlights | GenerateHighlights : method to generate highlights for the parent layout.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[] : list of highlights.
 */
export function getInitialHighlights(
  layoutProps: LayoutProps,
  baseHighlight: AnvilHighlightInfo,
  generateHighlights: GenerateHighlights,
  getDimensions: GetDimensions,
  isDropTarget: boolean,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  const { layoutId } = layoutProps;
  const layoutDimension: LayoutElementPosition = getDimensions(layoutId);

  // Get start position of the highlight along the y axis based on layoutAlignment.
  const posY: number =
    layoutDimension.top +
    getStartPosition(baseHighlight.alignment, layoutDimension.height);

  return generateHighlights(
    baseHighlight,
    layoutDimension,
    { ...layoutDimension, height: HIGHLIGHT_SIZE, top: posY },
    undefined,
    undefined,
    0,
    true,
    hasFillWidget,
    isDropTarget,
  );
}
