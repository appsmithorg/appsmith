import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import type { MutableRefObject } from "react";
import {
  SectionColumns,
  ZoneMinColumnWidth,
  ZoneMinShrinkablePixels,
} from "../constants";

/**
 * Utility function to convert pixel values to numbers.
 */
const convertPixelValuesToNumber = (value: string) => {
  return parseFloat(value.replace("px", ""));
};

/**
 * Utility function to calculate the bounding box value of an element.
 */
const getElementsBoundingBoxValue = (ele: HTMLElement) => {
  const computedStyle = getComputedStyle(ele);
  const paddingValue = convertPixelValuesToNumber(computedStyle.padding);
  const borderValue = convertPixelValuesToNumber(computedStyle.border);
  const marginValue = convertPixelValuesToNumber(computedStyle.margin);
  return 2 * (paddingValue + borderValue + marginValue);
};

/**
 * Function to get the boundary offset of an Anvil zone.
 */
export const getAnvilZoneBoundaryOffset = (zoneId: string) => {
  const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
  if (zoneDom) {
    return getElementsBoundingBoxValue(zoneDom) + 2;
  }
  return 0;
};

/**
 * Function to compute properties for space distribution.
 */
export const computePropsForSpaceDistribution = (spaceToWorkWith: number) => {
  const columnWidth = spaceToWorkWith / SectionColumns;
  const minLimitBounceBackThreshold = ZoneMinShrinkablePixels / columnWidth;
  const minimumShrinkableSpacePerBlock =
    ZoneMinColumnWidth - minLimitBounceBackThreshold;
  return {
    columnWidth,
    minimumShrinkableSpacePerBlock,
    minLimitBounceBackThreshold,
  };
};

/**
 * Functions to generate unique ID for zones
 */
export const getPropertyPaneZoneId = (zoneId: string) => {
  return `prop-pane-${zoneId}`;
};

/**
 * Functions to generate unique ID for distribution handle in between zones
 */
export const getDistributionHandleId = (zoneId: string) => {
  return `distribution-handle-${zoneId}`;
};

/**
 * Functions to generate unique ID for distribution handle in between zones on the property pane
 */
export const getPropertyPaneDistributionHandleId = (zoneId: string) => {
  return `prop-pane-distribution-handle-${zoneId}`;
};

/**
 * Function to track mouse speed.
 */
export const getMouseSpeedTrackingCallback = (
  currentMouseSpeed: MutableRefObject<number>,
) => {
  const resetSpeed = () => {
    currentMouseSpeed.current = 0;
  };
  let lastMouseX: number | null = null;
  let lastMouseY: number | null = null;
  let lastTimestamp: number | null = null;
  let mouseStoppedTimer: ReturnType<typeof setTimeout> | null = null;
  return function (event: MouseEvent) {
    const currentMouseX = event.clientX;
    const currentMouseY = event.clientY;
    const currentTimestamp = Date.now();

    if (lastMouseX !== null && lastMouseY !== null && lastTimestamp !== null) {
      const distanceX = currentMouseX - lastMouseX;
      const distanceY = currentMouseY - lastMouseY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2); // Euclidean distance
      const timeElapsed = (currentTimestamp - lastTimestamp) / 1000; // Convert to seconds

      const speed = distance / timeElapsed;
      currentMouseSpeed.current = speed;
      if (mouseStoppedTimer) {
        // Reset the timer when the mouse moves
        clearTimeout(mouseStoppedTimer);
      }
      mouseStoppedTimer = setTimeout(resetSpeed, 1000);
    }

    lastMouseX = currentMouseX;
    lastMouseY = currentMouseY;
    lastTimestamp = currentTimestamp;
  };
};

/**
 * Reset CSS styles for the distribution handle when not in use.
 */
export const resetDistributionHandleCSS = (
  ref: React.RefObject<HTMLDivElement>,
  propPaneHandle: HTMLElement | null,
) => {
  if (ref.current) {
    ref.current.style.transition = "";
    ref.current.classList.remove("active");
    ref.current.style.left = "";
    ref.current.style.display = "none";
  }
  if (propPaneHandle) {
    propPaneHandle.style.transition = "";
    propPaneHandle.classList.remove("active");
  }
};

/**
 * Reset CSS styles for all zones.
 */
export const resetCSSOnZones = (spaceDistributed: {
  [key: string]: number;
}) => {
  Object.keys(spaceDistributed).forEach((zoneId) => {
    const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
    const zonePropDom = document.getElementById(getPropertyPaneZoneId(zoneId));
    if (zoneDom) {
      zoneDom.style.flexGrow = "";
      zoneDom.style.transition = "all 0.3s ease";
      if (zonePropDom) {
        zonePropDom.style.flexGrow = "";
        zonePropDom.style.transition = "all 0.3s ease";
      }
      setTimeout(() => {
        zoneDom.style.transition = "";
        if (zonePropDom) {
          zonePropDom.style.transition = "";
        }
      }, 500);
    }
  });
};
