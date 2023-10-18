import type { DropZone } from "layoutSystems/common/utils/types";
import {
  HIGHLIGHT_SIZE,
  HORIZONTAL_DROP_ZONE_MULTIPLIER,
  VERTICAL_DROP_ZONE_MULTIPLIER,
} from "../../constants";
import type { LayoutElementPosition } from "layoutSystems/common/types";

/**
 * Calculate vertical drop zone of a horizontal highlight using information of child widgets / layouts.
 * 1. Drop zone above the horizontal highlight (top) spans half the space between current child entity and the previous one.
 * 2. Drop zone below the horizontal highlight (bottom) spans half the space between current child entity and the next one.
 * 3. if there is no previous child entity, then top drop zone equals the game between current child entity and the parent.
 * @param currentDimensions | LayoutElementPosition
 * @param prevDimensions | LayoutElementPosition | undefined
 * @param nextDimensions | LayoutElementPosition | undefined
 * @returns DropZone
 */
export function getVerticalDropZone(
  currentDimensions: LayoutElementPosition,
  prevDimensions: LayoutElementPosition | undefined,
  nextDimensions: LayoutElementPosition | undefined,
): DropZone {
  const { height, top } = currentDimensions;
  return {
    top: prevDimensions
      ? (top - prevDimensions.top) * VERTICAL_DROP_ZONE_MULTIPLIER
      : top,
    bottom:
      (nextDimensions ? nextDimensions.top - top : height) *
      VERTICAL_DROP_ZONE_MULTIPLIER,
  };
}

/**
 * Calculate vertical drop zone of the final horizontal highlight that is added below the last child entity.
 * 1. Drop zone above the horizontal highlight (top) spans half the space between the highlight and the previous one.
 * 2. Drop zone below the horizontal highlight (bottom) spans half the space between current child entity the parent layout's bottom.
 * @param currentDimensions | LayoutElementPosition
 * @param layoutDimensions | LayoutElementPosition
 * @param rowIndex | number : index of child in this position
 * @returns DropZone
 */
export function getFinalVerticalDropZone(
  currentDimensions: LayoutElementPosition,
  layoutDimensions: LayoutElementPosition,
): DropZone {
  const { height, top } = currentDimensions;
  return {
    top: (height + HIGHLIGHT_SIZE / 2) * VERTICAL_DROP_ZONE_MULTIPLIER,
    bottom: layoutDimensions.height - (top + height),
  };
}

/**
 * Drop zone for an initial highlight in an empty layout.
 * @param currentDimensions | LayoutElementPosition
 * @param layoutDimensions | LayoutElementPosition
 * @returns DropZone
 */
export function getInitialVerticalDropZone(
  currentDimensions: LayoutElementPosition,
  layoutDimensions: LayoutElementPosition,
): DropZone {
  return {
    top: currentDimensions.top,
    bottom: layoutDimensions.height - currentDimensions.top,
  };
}

/**
 * Calculate horizontal drop zone of a vertical highlight using information of child widgets / layouts.
 * 1. Drop zone before the vertical highlight (left) spans 35% of the space between current child entity and the previous one.
 * 2. Drop zone after the vertical highlight (right) spans 35% of the space between current child entity and the next one.
 * 3. if there is no previous child entity, then left drop zone equals the game between current child entity and the parent.
 * @param currentDimensions | LayoutElementPosition
 * @param prevDimensions | LayoutElementPosition | undefined
 * @param nextDimensions | LayoutElementPosition | undefined
 * @param isDropTarget | boolean
 * @returns DropZone
 */
export function getHorizontalDropZone(
  currentDimensions: LayoutElementPosition,
  prevDimensions: LayoutElementPosition | undefined,
  nextDimensions: LayoutElementPosition | undefined,
  isDropTarget: boolean,
): DropZone {
  const { left, width } = currentDimensions;
  const multiplier = isDropTarget ? 1 : HORIZONTAL_DROP_ZONE_MULTIPLIER;
  return {
    /**
     * Drop zone on either side of the highlight
     * should extend up to 35% of the gap
     * between itself and it's neighbor in that direction.
     */
    left: prevDimensions ? (left - prevDimensions.left) * multiplier : left,
    right: (nextDimensions ? nextDimensions.left - left : width) * multiplier,
  };
}

/**
 * Calculate horizontal drop zone of the final vertical highlight that is added below the last child entity.
 * 1. Drop zone before the vertical highlight (left) spans half the space between the highlight and the previous one.
 * 2. Drop zone after the vertical highlight (right) spans half the space between current child entity the parent layout's right edge.
 * @param currentDimensions | LayoutElementPosition
 * @param layoutDimensions | LayoutElementPosition
 * @param isDropTarget | boolean
 * @returns DropZone
 */
export function getFinalHorizontalDropZone(
  currentDimensions: LayoutElementPosition,
  layoutDimensions: LayoutElementPosition,
  isDropTarget: boolean,
): DropZone {
  const { left, width } = currentDimensions;
  const multiplier = isDropTarget ? 1 : HORIZONTAL_DROP_ZONE_MULTIPLIER;
  return {
    left: (width + HIGHLIGHT_SIZE / 2) * multiplier,
    right: Math.max(
      layoutDimensions.left + layoutDimensions.width - (left + width),
      0,
    ),
  };
}

/**
 * @param currentDimensions | LayoutElementPosition
 * @param layoutDimensions | LayoutElementPosition
 * @returns DropZone
 */
export function getInitialHorizontalDropZone(
  currentDimensions: LayoutElementPosition,
  layoutDimensions: LayoutElementPosition,
): DropZone {
  return {
    left: currentDimensions.left,
    right: layoutDimensions.width - currentDimensions.left,
  };
}
