import { getAnvilWidgetDOMId } from "layoutSystems/common/utils/LayoutElementPositionsObserver/utils";
import type { MutableRefObject } from "react";
import { SectionColumns, ZoneMinColumnWidth } from "../utils/constants";
import { ZoneMinShrinkablePixels } from "./constants";

export interface SpaceDistributionZoneDomCollection {
  leftZoneDom: HTMLElement;
  rightZoneDom: HTMLElement;
  leftZonePropPaneDom: HTMLElement | null;
  rightZonePropPaneDom: HTMLElement | null;
}

const speedLimitForAnimation = 4000;
const baseAnimationDuration = 0.25;
const ratioOfSpeedToAnimation = baseAnimationDuration / speedLimitForAnimation;
const checkForNeedToAddMagneticForce = (
  mouseSpeed: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
  leftZoneComputedColumnsRoundOff: number,
  rightZoneComputedColumnsRoundOff: number,
) => {
  const {
    leftZoneDom,
    leftZonePropPaneDom,
    rightZoneDom,
    rightZonePropPaneDom,
  } = zoneDomCollection;
  const reflectOnPropPane = leftZonePropPaneDom && rightZonePropPaneDom;
  const transitionStyle = `all ${
    baseAnimationDuration -
    Math.min(mouseSpeed, speedLimitForAnimation) * ratioOfSpeedToAnimation
  }s ease-in-out`;
  [leftZoneDom, rightZoneDom].forEach((zoneDom) => {
    zoneDom.style.transition = transitionStyle;
  });

  leftZoneDom.style.flexGrow = leftZoneComputedColumnsRoundOff.toString();
  rightZoneDom.style.flexGrow = rightZoneComputedColumnsRoundOff.toString();
  // Add same transition to the prop pane zone blocks if it exists
  if (reflectOnPropPane) {
    [leftZonePropPaneDom, rightZonePropPaneDom].forEach((zoneDom) => {
      zoneDom.style.transition = transitionStyle;
    });
    leftZonePropPaneDom.style.flexGrow =
      leftZoneComputedColumnsRoundOff.toString();
    rightZonePropPaneDom.style.flexGrow =
      rightZoneComputedColumnsRoundOff.toString();
    leftZonePropPaneDom.innerHTML = leftZoneComputedColumnsRoundOff.toString();
    rightZonePropPaneDom.innerHTML =
      rightZoneComputedColumnsRoundOff.toString();
  }
};

// Check if resistive force is needed for the zones
const checkForNeedToAddResistiveForce = (
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
  ref: React.RefObject<HTMLDivElement>,
) => {
  const {
    leftZoneDom,
    leftZonePropPaneDom,
    rightZoneDom,
    rightZonePropPaneDom,
  } = zoneDomCollection;
  if (ref.current) {
    // Check if the zones are below the minimum space
    const isLeftZoneLessThanMinimum =
      leftZoneComputedColumns <= ZoneMinColumnWidth;
    const isRightZoneLessThanMinimum =
      rightZoneComputedColumns <= ZoneMinColumnWidth;
    const reflectOnPropPane = leftZonePropPaneDom && rightZonePropPaneDom;
    const hasHitMinimumLimit =
      isLeftZoneLessThanMinimum || isRightZoneLessThanMinimum;
    // Apply transition if zones are below the minimum space, else remove transition
    const transitionStyle = hasHitMinimumLimit
      ? `all ${baseAnimationDuration}s ease`
      : "";
    [leftZoneDom, rightZoneDom].forEach((zoneDom) => {
      zoneDom.style.transition = transitionStyle;
    });
    if (reflectOnPropPane) {
      [leftZonePropPaneDom, rightZonePropPaneDom].forEach((zoneDom) => {
        zoneDom.style.transition = transitionStyle;
      });
    }
  }
};

export const getSpaceRedistributionProps = (spaceToWorkWith: number) => {
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

export const getPropertyPaneZoneId = (zoneId: string) => {
  return `prop-pane-${zoneId}`;
};

export const getDistributionHandleId = (zoneId: string) => {
  return `distribution-handle-${zoneId}`;
};

export const getPropertyPaneDistributionHandleId = (zoneId: string) => {
  return `prop-pane-distribution-handle-${zoneId}`;
};

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

export const updateCSSOfWidgetsOnHittingMinimumLimit = (
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
  currentFlexGrow: { [key: string]: number },
  currentGrowthFactor: { [key: string]: number },
  minimumShrinkableSpacePerBlock: number,
) => {
  const {
    leftZoneDom,
    leftZonePropPaneDom,
    rightZoneDom,
    rightZonePropPaneDom,
  } = zoneDomCollection;
  const totalSpace = currentFlexGrow.leftZone + currentFlexGrow.rightZone;
  const spaceForTheZoneOtherThanShrunkenZone = totalSpace - ZoneMinColumnWidth;
  const reflectOnPropPane = leftZonePropPaneDom && rightZonePropPaneDom;
  if (leftZoneComputedColumns < minimumShrinkableSpacePerBlock) {
    leftZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
    rightZoneDom.style.flexGrow = (
      totalSpace - minimumShrinkableSpacePerBlock
    ).toString();
    if (reflectOnPropPane) {
      leftZonePropPaneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
      rightZonePropPaneDom.style.flexGrow = (
        totalSpace - minimumShrinkableSpacePerBlock
      ).toString();
      leftZonePropPaneDom.innerHTML = ZoneMinColumnWidth.toString();
      rightZonePropPaneDom.innerHTML =
        spaceForTheZoneOtherThanShrunkenZone.toString();
    }
    currentGrowthFactor.leftZone = ZoneMinColumnWidth;
    currentGrowthFactor.rightZone = spaceForTheZoneOtherThanShrunkenZone;
  } else if (rightZoneComputedColumns < minimumShrinkableSpacePerBlock) {
    rightZoneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
    leftZoneDom.style.flexGrow = (
      totalSpace - minimumShrinkableSpacePerBlock
    ).toString();
    if (reflectOnPropPane) {
      rightZonePropPaneDom.style.flexGrow = `${minimumShrinkableSpacePerBlock}`;
      leftZonePropPaneDom.style.flexGrow = (
        totalSpace - minimumShrinkableSpacePerBlock
      ).toString();
      rightZonePropPaneDom.innerHTML = ZoneMinColumnWidth.toString();
      leftZonePropPaneDom.innerHTML =
        spaceForTheZoneOtherThanShrunkenZone.toString();
    }
    currentGrowthFactor.leftZone = spaceForTheZoneOtherThanShrunkenZone;
    currentGrowthFactor.rightZone = ZoneMinColumnWidth;
  }
};

export const updateCSSOfWidgetsOnHandleMove = (
  ref: React.RefObject<HTMLDivElement>,
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
  currentFlexGrow: { [key: string]: number },
  currentGrowthFactor: { [key: string]: number },
  leftZoneComputedColumnsRoundOff: number,
  rightZoneComputedColumnsRoundOff: number,
  columnIndicatorDivRef: MutableRefObject<HTMLDivElement | undefined>,
  columnPosition: number,
  mouseSpeed: number,
) => {
  checkForNeedToAddResistiveForce(
    leftZoneComputedColumns,
    rightZoneComputedColumns,
    zoneDomCollection,
    ref,
  );
  checkForNeedToAddMagneticForce(
    mouseSpeed,
    zoneDomCollection,
    leftZoneComputedColumnsRoundOff,
    rightZoneComputedColumnsRoundOff,
  );

  // note down the new growth factor for the zones
  currentGrowthFactor.leftZone = leftZoneComputedColumnsRoundOff;
  currentGrowthFactor.rightZone = rightZoneComputedColumnsRoundOff;

  // Update the column indicator text to reflect the new column positions
  if (columnIndicatorDivRef.current) {
    columnIndicatorDivRef.current.innerHTML = `${
      columnPosition -
      currentFlexGrow.leftZone +
      leftZoneComputedColumnsRoundOff
    } / ${SectionColumns}`;
  }
};

// Reset CSS styles for the handle when not in use
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

// Reset CSS styles for all zones
export const resetCSSOnZones = (spaceDistributed: {
  [key: string]: number;
}) => {
  Object.keys(spaceDistributed).forEach((zoneId) => {
    const zoneDom = document.getElementById(getAnvilWidgetDOMId(zoneId));
    if (zoneDom) {
      zoneDom.style.flexGrow = "";
      zoneDom.style.transition = "all 0.3s ease";
      setTimeout(() => {
        zoneDom.style.transition = "";
      }, 500);
    }
  });
};
