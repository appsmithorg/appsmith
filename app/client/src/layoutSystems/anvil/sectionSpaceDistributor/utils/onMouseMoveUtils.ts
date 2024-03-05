import type { MutableRefObject } from "react";
import { SectionColumns, ZoneMinColumnWidth } from "../constants";
import { convertFlexGrowToFlexBasis } from "./spaceDistributionEditorUtils";

// Interface representing the DOM elements associated with a space distribution zone
export interface SpaceDistributionZoneDomCollection {
  leftZoneDom: HTMLElement;
  rightZoneDom: HTMLElement;
  leftZonePropPaneDom: HTMLElement | null;
  rightZonePropPaneDom: HTMLElement | null;
}

// Constants for animation and speed control during handle move
const speedLimitForAnimation = 4000;
const baseAnimationDuration = 0.25;
const ratioOfSpeedToAnimation = baseAnimationDuration / speedLimitForAnimation;

// Function to check if magnetic force needs to be added during handle move
const adjustZoneFlexGrowForMagneticEffect = (
  mouseSpeed: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
  leftZoneComputedColumnsRoundOff: number,
  rightZoneComputedColumnsRoundOff: number,
) => {
  // Destructure zone DOM elements from the collection
  const {
    leftZoneDom,
    leftZonePropPaneDom,
    rightZoneDom,
    rightZonePropPaneDom,
  } = zoneDomCollection;

  // Check if prop pane zones exist
  const reflectOnPropPane = leftZonePropPaneDom && rightZonePropPaneDom;

  // Calculate transition duration based on mouse speed
  const transitionStyle = `all ${
    baseAnimationDuration -
    Math.min(mouseSpeed, speedLimitForAnimation) * ratioOfSpeedToAnimation
  }s ease-in-out`;

  // Apply transition styles to left and right zones
  [leftZoneDom, rightZoneDom].forEach((zoneDom) => {
    zoneDom.style.transition = transitionStyle;
  });
  // Set new flexGrow values for left and right zones
  leftZoneDom.style.flexBasis = convertFlexGrowToFlexBasis(
    leftZoneComputedColumnsRoundOff,
  );
  rightZoneDom.style.flexBasis = convertFlexGrowToFlexBasis(
    rightZoneComputedColumnsRoundOff,
  );

  // Add same transition to the prop pane zone blocks if they exist
  if (reflectOnPropPane) {
    [leftZonePropPaneDom, rightZonePropPaneDom].forEach((zoneDom) => {
      zoneDom.style.transition = transitionStyle;
    });
    leftZonePropPaneDom.style.flexBasis = convertFlexGrowToFlexBasis(
      leftZoneComputedColumnsRoundOff,
    );
    rightZonePropPaneDom.style.flexBasis = convertFlexGrowToFlexBasis(
      rightZoneComputedColumnsRoundOff,
    );
    leftZonePropPaneDom.innerHTML = leftZoneComputedColumnsRoundOff.toString();
    rightZonePropPaneDom.innerHTML =
      rightZoneComputedColumnsRoundOff.toString();
  }
};

// Function to check if resistive force needs to be added for the zones
const applyResistiveForceOnHandleMove = (
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
) => {
  // Destructure zone DOM elements from the collection
  const {
    leftZoneDom,
    leftZonePropPaneDom,
    rightZoneDom,
    rightZonePropPaneDom,
  } = zoneDomCollection;

  // Check if the zones are below the minimum space
  const isLeftZoneLessThanMinimum =
    leftZoneComputedColumns <= ZoneMinColumnWidth;
  const isRightZoneLessThanMinimum =
    rightZoneComputedColumns <= ZoneMinColumnWidth;

  // Check if prop pane zones exist
  const reflectOnPropPane = leftZonePropPaneDom && rightZonePropPaneDom;

  // Check if the zones hit the minimum limit
  const hasHitMinimumLimit =
    isLeftZoneLessThanMinimum || isRightZoneLessThanMinimum;

  // Apply or remove transition based on hitting the minimum limit
  const transitionStyle = hasHitMinimumLimit
    ? `all ${baseAnimationDuration}s ease`
    : "";
  [leftZoneDom, rightZoneDom].forEach((zoneDom) => {
    zoneDom.style.transition = transitionStyle;
  });

  // Apply or remove transition to the prop pane zone blocks if they exist
  if (reflectOnPropPane) {
    [leftZonePropPaneDom, rightZonePropPaneDom].forEach((zoneDom) => {
      zoneDom.style.transition = transitionStyle;
    });
  }
};

// Function to update the CSS of widgets during handle move
export const updateWidgetCSSOnHandleMove = (
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
  // Check for resistive force during handle move
  applyResistiveForceOnHandleMove(
    leftZoneComputedColumns,
    rightZoneComputedColumns,
    zoneDomCollection,
  );

  // Check for magnetic force during handle move
  adjustZoneFlexGrowForMagneticEffect(
    mouseSpeed,
    zoneDomCollection,
    leftZoneComputedColumnsRoundOff,
    rightZoneComputedColumnsRoundOff,
  );

  // Note down the new growth factor for the zones
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

// Function to update the CSS of widgets when hitting the minimum limit
export const updateWidgetCSSOnMinimumLimit = (
  leftZoneComputedColumns: number,
  rightZoneComputedColumns: number,
  zoneDomCollection: SpaceDistributionZoneDomCollection,
  currentFlexGrow: { [key: string]: number },
  currentGrowthFactor: { [key: string]: number },
  minimumShrinkableSpacePerBlock: number,
) => {
  // Destructure zone DOM elements from the collection
  const {
    leftZoneDom,
    leftZonePropPaneDom,
    rightZoneDom,
    rightZonePropPaneDom,
  } = zoneDomCollection;

  // Calculate total space and space for the zone other than the shrunken zone
  const totalSpace = currentFlexGrow.leftZone + currentFlexGrow.rightZone;
  const spaceForTheZoneOtherThanShrunkenZone = totalSpace - ZoneMinColumnWidth;

  // Check if prop pane zones exist
  const reflectOnPropPane = leftZonePropPaneDom && rightZonePropPaneDom;

  // Check if the left zone needs to be shrunk
  if (leftZoneComputedColumns < minimumShrinkableSpacePerBlock) {
    leftZoneDom.style.flexBasis = convertFlexGrowToFlexBasis(
      minimumShrinkableSpacePerBlock,
    );
    rightZoneDom.style.flexBasis = convertFlexGrowToFlexBasis(
      totalSpace - minimumShrinkableSpacePerBlock,
    );

    // Reflect the changes on prop pane zones if they exist
    if (reflectOnPropPane) {
      leftZonePropPaneDom.style.flexBasis = convertFlexGrowToFlexBasis(
        minimumShrinkableSpacePerBlock,
      );
      rightZonePropPaneDom.style.flexBasis = convertFlexGrowToFlexBasis(
        totalSpace - minimumShrinkableSpacePerBlock,
      );
      leftZonePropPaneDom.innerHTML = ZoneMinColumnWidth.toString();
      rightZonePropPaneDom.innerHTML =
        spaceForTheZoneOtherThanShrunkenZone.toString();
    }

    // Update the growth factors for the zones
    currentGrowthFactor.leftZone = ZoneMinColumnWidth;
    currentGrowthFactor.rightZone = spaceForTheZoneOtherThanShrunkenZone;
  } else if (rightZoneComputedColumns < minimumShrinkableSpacePerBlock) {
    // Check if the right zone needs to be shrunk
    rightZoneDom.style.flexBasis = convertFlexGrowToFlexBasis(
      minimumShrinkableSpacePerBlock,
    );
    leftZoneDom.style.flexBasis = convertFlexGrowToFlexBasis(
      totalSpace - minimumShrinkableSpacePerBlock,
    );

    // Reflect the changes on prop pane zones if they exist
    if (reflectOnPropPane) {
      rightZonePropPaneDom.style.flexBasis = convertFlexGrowToFlexBasis(
        minimumShrinkableSpacePerBlock,
      );
      leftZonePropPaneDom.style.flexBasis = convertFlexGrowToFlexBasis(
        totalSpace - minimumShrinkableSpacePerBlock,
      );
      rightZonePropPaneDom.innerHTML = ZoneMinColumnWidth.toString();
      leftZonePropPaneDom.innerHTML =
        spaceForTheZoneOtherThanShrunkenZone.toString();
    }

    // Update the growth factors for the zones
    currentGrowthFactor.leftZone = spaceForTheZoneOtherThanShrunkenZone;
    currentGrowthFactor.rightZone = ZoneMinColumnWidth;
  }
};
