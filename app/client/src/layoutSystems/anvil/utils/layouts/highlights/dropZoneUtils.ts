import type { DropZone } from "layoutSystems/common/utils/types";

import {
  HIGHLIGHT_SIZE,
  HORIZONTAL_DROP_ZONE_MULTIPLIER,
  VERTICAL_DROP_ZONE_MULTIPLIER,
} from "../../constants";
import type { WidgetPosition } from "layoutSystems/common/types";

/**
 * Calculate vertical drop zone of a horizontal highlight using information of child widgets / layouts.
 * 1. Drop zone above the horizontal highlight (top) spans half the space between current child entity and the previous one.
 * 2. Drop zone below the horizontal highlight (bottom) spans half the space between current child entity and the next one.
 * 3. if there is no previous child entity, then top drop zone equals the game between current child entity and the parent.
 * @param currentDimensions | WidgetPosition
 * @param prevDimensions | WidgetPosition | undefined
 * @param nextDimensions | WidgetPosition | undefined
 * @returns DropZone
 */
export function getVerticalDropZone(
  currentDimensions: WidgetPosition,
  prevDimensions: WidgetPosition | undefined,
  nextDimensions: WidgetPosition | undefined,
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
 * @param currentDimensions | WidgetPosition
 * @param layoutDimensions | WidgetPosition
 * @param rowIndex | number : index of child in this position
 * @returns DropZone
 */
export function getFinalVerticalDropZone(
  currentDimensions: WidgetPosition,
  layoutDimensions: WidgetPosition,
): DropZone {
  const { height, top } = currentDimensions;
  return {
    top: (height + HIGHLIGHT_SIZE / 2) * VERTICAL_DROP_ZONE_MULTIPLIER,
    bottom: layoutDimensions.height - (top + height),
  };
}

/**
 * Drop zone for an initial highlight in an empty layout.
 * @param currentDimensions | WidgetPosition
 * @param layoutDimensions | WidgetPosition
 * @returns DropZone
 */
export function getInitialVerticalDropZone(
  currentDimensions: WidgetPosition,
  layoutDimensions: WidgetPosition,
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
 * @param currentDimensions | WidgetPosition
 * @param prevDimensions | WidgetPosition | undefined
 * @param nextDimensions | WidgetPosition | undefined
 * @returns DropZone
 */
export function getHorizontalDropZone(
  currentDimensions: WidgetPosition,
  prevDimensions: WidgetPosition | undefined,
  nextDimensions: WidgetPosition | undefined,
): DropZone {
  const { left, width } = currentDimensions;
  return {
    /**
     * Drop zone on either side of the highlight
     * should extend up to 35% of the gap
     * between itself and it's neighbor in that direction.
     */
    left: prevDimensions
      ? (left - prevDimensions.left) * HORIZONTAL_DROP_ZONE_MULTIPLIER
      : left,
    right:
      (nextDimensions ? nextDimensions.left - left : width) *
      HORIZONTAL_DROP_ZONE_MULTIPLIER,
  };
}

/**
 * Calculate horizontal drop zone of the final vertical highlight that is added below the last child entity.
 * 1. Drop zone before the vertical highlight (left) spans half the space between the highlight and the previous one.
 * 2. Drop zone after the vertical highlight (right) spans half the space between current child entity the parent layout's right edge.
 * @param currentDimensions | WidgetPosition
 * @param layoutDimensions | WidgetPosition
 * @returns DropZone
 */
export function getFinalHorizontalDropZone(
  currentDimensions: WidgetPosition,
  layoutDimensions: WidgetPosition,
): DropZone {
  const { left, width } = currentDimensions;
  return {
    left: (width + HIGHLIGHT_SIZE / 2) * HORIZONTAL_DROP_ZONE_MULTIPLIER,
    right: layoutDimensions.width - (left + width),
  };
}

/**
 * @param currentDimensions | WidgetPosition
 * @param layoutDimensions | WidgetPosition
 * @returns DropZone
 */
export function getInitialHorizontalDropZone(
  currentDimensions: WidgetPosition,
  layoutDimensions: WidgetPosition,
): DropZone {
  return {
    left: currentDimensions.left,
    right: layoutDimensions.width - currentDimensions.left,
  };
}
