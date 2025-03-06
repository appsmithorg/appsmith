import type { XYCord } from "layoutSystems/common/canvasArenas/ArenaTypes";
import type {
  AnvilHighlightInfo,
  DraggedWidget,
} from "layoutSystems/anvil/utils/anvilTypes";
import WidgetFactory from "WidgetProvider/factory";
import type { CanvasWidgetsReduxState } from "ee/reducers/entityReducers/canvasWidgetsReducer";
import type { DragDetails } from "reducers/uiReducers/dragResizeReducer";
import { AnvilDraggedWidgetTypesEnum } from "../types";
import { anvilWidgets } from "widgets/wds/constants";
import { HIGHLIGHT_SIZE } from "layoutSystems/anvil/utils/constants";
import { getWidgetHierarchy } from "layoutSystems/anvil/utils/paste/utils";

/**
 * Determines whether a canvas can be activated for a dragged widget based on specific conditions.
 * @param draggedWidgetTypes - Type of widget being dragged (e.g., SECTION, ZONE).
 * @param widgetId: string : Id of the target widget over which the dragged widgets may be dropped.
 * @param widgetType: string: Type of the target widget over which the dragged widgets may be dropped.
 * @returns {boolean} - True if the canvas can be activated, false otherwise.
 */
export const canActivateCanvasForDraggedWidget = (
  draggedWidgetHierarchy: number,
  widgetId: string,
  widgetType: string,
) => {
  /**
   * Get hierarchy of the drop target widget.
   */
  const dropTargetHierarchy: number = getWidgetHierarchy(widgetType, widgetId);

  /**
   * If drop target widget is of higher hierarchy than dragged widget, return true.
   * Higher hierarchy means the widget is closer to the main canvas and hierarchy index is closer to 0.
   */
  return dropTargetHierarchy < draggedWidgetHierarchy;
};

/**
 * Function to determine the types of widgets being dragged based on an array of dragged blocks.
 * @param {DraggedWidget[]} draggedBlocks - Array of dragged widget blocks with type information.
 * @returns {AnvilDraggedWidgetTypesEnum} - Enum representing the type of widgets being dragged.
 */
export const getDraggedWidgetTypes = (draggedBlocks: DraggedWidget[]) => {
  // Extracting unique widget types from the array of dragged blocks
  const extractWidgetTypesDragged: string[] = draggedBlocks.reduce(
    (widgetTypesArray, each) => {
      // Checking if the widget type is not already in the array and adding it if not present
      if (!widgetTypesArray.includes(each.type)) {
        widgetTypesArray.push(each.type);
      }

      return widgetTypesArray;
    },
    [] as string[],
  );

  // Determining the overall dragged widget type based on the extracted types
  const draggedWidgetTypes =
    extractWidgetTypesDragged.length > 1
      ? AnvilDraggedWidgetTypesEnum.WIDGETS
      : extractWidgetTypesDragged[0] === anvilWidgets.ZONE_WIDGET
        ? AnvilDraggedWidgetTypesEnum.ZONE
        : extractWidgetTypesDragged[0] === anvilWidgets.SECTION_WIDGET
          ? AnvilDraggedWidgetTypesEnum.SECTION
          : AnvilDraggedWidgetTypesEnum.WIDGETS;

  // Returning the final dragged widget type
  return draggedWidgetTypes;
};

/**
 *
 * @param draggedWidgets : DraggedWidget[]
 * @returns : number - Highest hierarchy of the dragged widgets
 */
export function getDraggedWidgetHierarchy(
  draggedWidgets: DraggedWidget[],
): number {
  return draggedWidgets.reduce((acc: number, each: DraggedWidget) => {
    const order: number = getWidgetHierarchy(each.type, each.widgetId);

    return order < acc ? order : acc;
  }, 1000);
}

/**
 * getDraggedBlocks function returns an array of DraggedWidget.
 * If the dragged widget is a new widget pulled out of the widget cards,
 * specific info like type, widgetId and responsiveBehavior are filled using dragDetails
 */

export const getDraggedBlocks = (
  isNewWidget: boolean,
  dragDetails: DragDetails,
  selectedWidgets: string[],
  allWidgets: CanvasWidgetsReduxState,
): DraggedWidget[] => {
  if (isNewWidget) {
    const { newWidget } = dragDetails;

    return [
      {
        parentId: newWidget.parentId,
        responsiveBehavior:
          newWidget.responsiveBehavior ??
          WidgetFactory.getConfig(newWidget.type)?.responsiveBehavior,
        type: newWidget.type,
        widgetId: newWidget.widgetId,
      },
    ];
  } else {
    return selectedWidgets
      .map((eachWidgetId) => {
        if (allWidgets[eachWidgetId]) {
          return {
            parentId: allWidgets[eachWidgetId].parentId,
            responsiveBehavior: allWidgets[eachWidgetId].responsiveBehavior,
            type: allWidgets[eachWidgetId].type,
            widgetId: eachWidgetId,
          };
        }

        return;
      })
      .filter(Boolean) as DraggedWidget[];
  }
};

export const getClosestHighlight = (
  pos: XYCord,
  highlights: AnvilHighlightInfo[],
) => {
  if (!highlights || !highlights.length) return;

  /**
   * Filter highlights that  span the current mouse position.
   */
  let filteredHighlights: AnvilHighlightInfo[] = getViableDropPositions(
    highlights,
    pos,
  );

  /**
   * Defensive coding:
   * If filtered highlights are empty,
   * use all highlights for proximity calculation.
   *
   * This is less performant, but improves experience.
   */
  if (!filteredHighlights?.length) {
    filteredHighlights = highlights;
  }

  // Sort filtered highlights in ascending order of distance from mouse position.
  const sortedHighlights = [...filteredHighlights]?.sort((a, b) => {
    return calculateDistance(a, pos) - calculateDistance(b, pos);
  });

  // Return the closest highlight.
  return sortedHighlights[0];
};
const PaddingForHorizontalDropZone = 8;

/**
 * Determines whether to show horizontal highlights based on specific conditions.
 * @param horizontalSelection - Array of horizontal highlights
 * @param closestVerticalHighlight - Closest vertical highlight to the mouse position
 * @param pos - Mouse position (X, Y coordinates)
 * @returns Boolean indicating whether to show horizontal highlights
 */
const shouldShowHorizontalHighlights = (
  horizontalSelection: AnvilHighlightInfo[],
  closestVerticalHighlight: AnvilHighlightInfo,
  pos: XYCord,
): boolean => {
  // Calculate the top position and height of the cell indicated by the closest vertical highlight
  const computedCellTopPosition = closestVerticalHighlight.posY;
  const computedCellHeight = closestVerticalHighlight.height;

  // Filter horizontal highlights that are close to the top of the computed cell
  const topHorizontalHighlights = horizontalSelection.filter(
    (highlight: AnvilHighlightInfo) =>
      computedCellTopPosition - HIGHLIGHT_SIZE <= highlight.posY &&
      computedCellTopPosition + HIGHLIGHT_SIZE >= highlight.posY,
  );

  // Filter horizontal highlights that are close to the bottom of the computed cell
  const bottomHorizontalHighlights = horizontalSelection.filter(
    (highlight: AnvilHighlightInfo) =>
      computedCellTopPosition + computedCellHeight - HIGHLIGHT_SIZE <=
        highlight.posY &&
      computedCellTopPosition + computedCellHeight + HIGHLIGHT_SIZE >=
        highlight.posY,
  );

  // Check if bottom highlights should be shown based on specific conditions
  const showBottomHighlights =
    !!bottomHorizontalHighlights.length &&
    pos.y >
      computedCellTopPosition +
        computedCellHeight -
        PaddingForHorizontalDropZone;

  // Check if top highlights should be shown based on specific conditions
  const showTopHighlights =
    !!topHorizontalHighlights.length &&
    pos.y < computedCellTopPosition + PaddingForHorizontalDropZone;

  // Return true if either top or bottom highlights should be shown
  return showBottomHighlights || showTopHighlights;
};

// Function to find the highlight(s) with the closest Y position to the given mouse position
const closestHighlightByY = (
  highlights: AnvilHighlightInfo[],
  position: XYCord,
): AnvilHighlightInfo[] => {
  // Find the closest highlight based on Y position
  const closestHighlight = highlights.reduce(
    (prev: AnvilHighlightInfo, curr: AnvilHighlightInfo) =>
      Math.abs(curr.posY - position.y) < Math.abs(prev.posY - position.y)
        ? curr
        : prev,
    highlights[0],
  );
  // Filter highlights that share the closest Y position
  const allClosestHighlights = highlights.filter(
    (highlight: AnvilHighlightInfo) => highlight.posY === closestHighlight.posY,
  );

  return allClosestHighlights;
};

// Main function to get viable drop positions based on mouse position and highlights
export function getViableDropPositions(
  highlights: AnvilHighlightInfo[],
  position: XYCord,
): AnvilHighlightInfo[] {
  // If there are no highlights, return an empty array
  if (!highlights) return [];

  // Filter highlights that span the current mouse position vertically
  const verticalSelection = highlights.filter(
    (highlight: AnvilHighlightInfo) => {
      return (
        highlight.isVertical &&
        position.y >= highlight.posY + PaddingForHorizontalDropZone &&
        position.y <=
          highlight.posY + highlight.height - PaddingForHorizontalDropZone
      );
    },
  );

  // Filter highlights that span the current mouse position horizontally
  const horizontalSelection = highlights.filter(
    (highlight: AnvilHighlightInfo) => {
      const isInsideVerticalRange =
        position.y >= highlight.posY &&
        position.y <= highlight.posY + highlight.height;

      const isInsideHorizontalRange =
        position.x >= highlight.posX &&
        position.x <= highlight.posX + highlight.width;

      const isInsidePaddedHorizontalRange =
        position.y <=
          highlight.posY + highlight.height - PaddingForHorizontalDropZone &&
        position.y >= highlight.posY + PaddingForHorizontalDropZone;

      return (
        !highlight.isVertical &&
        (isInsideVerticalRange || isInsidePaddedHorizontalRange) &&
        isInsideHorizontalRange
      );
    },
  );

  // If no highlights are found, return the closest highlights by mouse position Y
  if (horizontalSelection.length === 0 && verticalSelection.length === 0) {
    return closestHighlightByY(highlights, position);
  }

  // Determine whether to show vertical or horizontal highlights based on mouse position
  const isMouseInsideCell = verticalSelection.length > 0;
  let shouldShowVerticalHighlights = horizontalSelection.length === 0;

  // If inside a cell and not showing vertical highlights, further check for horizontal highlights
  if (isMouseInsideCell && !shouldShowVerticalHighlights) {
    // Find the closest vertical highlight based on Y position
    const closestVerticalHighlight = verticalSelection.reduce(
      (prev: AnvilHighlightInfo, curr: AnvilHighlightInfo) =>
        Math.abs(curr.posY - position.y) < Math.abs(prev.posY - position.y)
          ? curr
          : prev,
      verticalSelection[0],
    );
    // Check if horizontal highlights should be shown based on specific conditions
    const showHorizontalHighlights = shouldShowHorizontalHighlights(
      horizontalSelection,
      closestVerticalHighlight,
      position,
    );

    shouldShowVerticalHighlights =
      isMouseInsideCell && !showHorizontalHighlights;
  }

  // Return either vertical or horizontal highlights based on the determined conditions
  return shouldShowVerticalHighlights ? verticalSelection : horizontalSelection;
}

function calculateDistance(a: AnvilHighlightInfo, b: XYCord): number {
  let distX = 0,
    distY = 0;

  if (a.isVertical) {
    distX = b.x - a.posX;

    if (b.y < a.posY) {
      distY = b.y - a.posY;
    } else if (b.y > a.posY + a.height) {
      distY = b.y - (a.posY + a.height);
    } else {
      distY = 0;
    }
  } else {
    distY = b.y - a.posY;

    if (b.x < a.posX) {
      distX = b.x - a.posX;
    } else if (b.x > a.posX + a.width) {
      distX = b.x - (a.posX + a.width);
    } else {
      distX = 0;
    }
  }

  return Math.hypot(distX, distY);
}

/**
 * Function to render UX to denote that the widget type cannot be dropped in the layout
 */
export const renderDisallowDroppingUI = (slidingArena: HTMLDivElement) => {
  slidingArena.classList.add("disallow-dropping");
  slidingArena.innerText = "This Layout doesn't support the widget";
};

export const removeDisallowDroppingsUI = (slidingArena: HTMLDivElement) => {
  slidingArena.classList.remove("disallow-dropping");
  slidingArena.innerText = "";
};
