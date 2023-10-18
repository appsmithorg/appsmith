import type {
  AnvilHighlightInfo,
  GenerateHighlights,
  GetDimensions,
  LayoutProps,
} from "../../anvilTypes";
import { getStartPosition } from "./highlightUtils";
import { HIGHLIGHT_SIZE } from "../../constants";
import type { LayoutElementPosition } from "layoutSystems/common/types";

/**
 * @param layoutProps | LayoutProps : properties of parent layout.
 * @param baseHighlight | AnvilHighlightInfo : base highlight object.
 * @param generateHighlights | GenerateHighlights : method of generate highlights for the parent layout.
 * @param getDimensions | GetDimensions : method of getting dimensions of a widget.
 * @param isDropTarget | boolean
 * @param hasFillWidget | boolean | undefined : whether the list of dragged widgets includes a Fill widget.
 * @returns AnvilHighlightInfo[]
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
    isDropTarget,
  );
}
