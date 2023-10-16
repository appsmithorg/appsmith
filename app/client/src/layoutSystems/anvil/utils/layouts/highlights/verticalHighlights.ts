import type {
  AnvilHighlightInfo,
  GenerateHighlights,
  LayoutProps,
} from "../../anvilTypes";
import { getStartPosition } from "./highlightUtils";
import { HIGHLIGHT_SIZE } from "../../constants";
import type {
  WidgetPosition,
  WidgetPositions,
} from "layoutSystems/common/types";
import { getRelativeDimensions } from "./dimensionUtils";

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param widgetPositions | WidgetPositions
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param parentDropTargetId | string : id of immediate drop target ancestor.
 * @param generateHighlights | GenerateHighlights : method of generate highlights for the parent layout.
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[]
 */
export function getInitialHighlights(
  layoutProps: LayoutProps,
  widgetPositions: WidgetPositions,
  baseHighlight: AnvilHighlightInfo,
  parentDropTargetId: string,
  generateHighlights: GenerateHighlights,
  hasFillWidget = false,
): AnvilHighlightInfo[] {
  const { layoutId } = layoutProps;

  const layoutDimension: WidgetPosition = getRelativeDimensions(
    layoutId,
    parentDropTargetId,
    widgetPositions,
  );

  const posX: number = getStartPosition(
    baseHighlight.alignment,
    layoutDimension.width,
  );
  return generateHighlights(
    baseHighlight,
    layoutDimension,
    { ...layoutDimension, left: posX, width: HIGHLIGHT_SIZE },
    undefined,
    undefined,
    0,
    true,
    hasFillWidget,
  );
}
