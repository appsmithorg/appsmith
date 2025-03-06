import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "ee/reducers/entityReducers/canvasWidgetsReducer";
import { SectionColumns, ZoneMinColumnWidth } from "../constants";
import type { WidgetLayoutProps } from "layoutSystems/anvil/utils/anvilTypes";
import { select } from "redux-saga/effects";
import { getWidgets } from "sagas/selectors";

/**
 * Redistributes space among zones in a section while preserving column ratios.
 * @param spaceDistributedObj - Object containing the current space distribution for each zone.
 * @param zoneOrder - Array defining the order of zones in the section.
 * @param zoneChangeFactor - Amount of space to add or remove (positive for addition, negative for removal).
 * @param index - Index of the zone where space is added or removed.
 * @param addedViaStepper - Indicates whether the change was initiated via stepper.
 * @returns Updated space distribution after the change.
 */
export const redistributeSectionSpace = (
  spaceDistributedObj: { [key: string]: number },
  zoneOrder: string[],
  zoneChangeFactor: number,
  index: number,
  addedViaStepper?: boolean,
  maxColumnLimit = SectionColumns,
): number[] => {
  const spaceDistributedArray = zoneOrder.map(
    (zone) => spaceDistributedObj[zone],
  );

  // Check if the change is smaller than the minimum zone column width
  if (Math.abs(zoneChangeFactor) < ZoneMinColumnWidth) {
    return spaceDistributedArray;
  }

  // Calculate the maximum space that can be added or removed
  const spaceWelcomed =
    maxColumnLimit - ZoneMinColumnWidth * spaceDistributedArray.length;

  // Determine the actual change considering the maximum space and direction of change
  const zoneChange =
    zoneChangeFactor > spaceWelcomed && zoneChangeFactor > 0
      ? spaceWelcomed
      : zoneChangeFactor;

  // Calculate the even distribution space for comparison
  const evenDistributionSpace = maxColumnLimit / spaceDistributedArray.length;

  // Check if the layout is evenly distributed
  const evenlyDistributedLayout =
    (addedViaStepper || spaceDistributedArray.length > 1) &&
    spaceDistributedArray.every((each) => each === evenDistributionSpace);

  // Determine if adding or removing space
  const isAddingZone = zoneChange > 0;

  // Modify the array based on the operation
  if (isAddingZone) {
    spaceDistributedArray.splice(index, 0, zoneChange);
  } else {
    spaceDistributedArray.splice(index, 1);
  }

  // Check if the layout is still evenly distributed after the change
  if (evenlyDistributedLayout) {
    const updatedEvenDistributionSpace =
      maxColumnLimit / spaceDistributedArray.length;

    return new Array(spaceDistributedArray.length).fill(
      updatedEvenDistributionSpace,
    );
  }

  // Initialize indices and space variables
  let leftIndex = index - 1;
  let rightIndex = isAddingZone ? index + 1 : index;
  let spaceRightNow = spaceDistributedArray.reduce(
    (result, each) => each + result,
    0,
  );

  // Determine the direction and adjust space until the target is reached
  const changeFactor = isAddingZone ? -1 : 1;

  while (spaceRightNow !== SectionColumns) {
    if (leftIndex !== -1) {
      if (
        spaceDistributedArray[leftIndex] + changeFactor <
        ZoneMinColumnWidth
      ) {
        --leftIndex;
        continue;
      }

      spaceDistributedArray[leftIndex] += changeFactor;
      spaceRightNow += changeFactor;
    }

    if (spaceRightNow === SectionColumns) {
      break;
    }

    if (rightIndex !== spaceDistributedArray.length) {
      if (
        spaceDistributedArray[rightIndex] + changeFactor <
        ZoneMinColumnWidth
      ) {
        ++rightIndex;
        continue;
      }

      spaceDistributedArray[rightIndex] += changeFactor;
      spaceRightNow += changeFactor;
    }

    if (spaceRightNow === SectionColumns) {
      break;
    }
  }

  return spaceDistributedArray;
};

/**
 * Calculates the default distribution of space among zones based on the total number of columns in a section.
 * @param zones - An array of zone identifiers.
 * @returns {Object} - An object representing the default space distribution among zones.
 */
export const getDefaultSpaceDistributed = (zones: string[]) => {
  // Using the reduce function to calculate the default space distribution
  return zones.reduce(
    (distributedSpace, each: string) => {
      // Setting the distributed space for each zone based on the total number of columns
      distributedSpace[each] = SectionColumns / zones.length;

      return distributedSpace;
    },
    {} as { [key: string]: number }, // Initializing the accumulator as an object with zone identifiers as keys and distributed space as values
  );
};

export const reAdjustSpaceDistribution = (
  currentDistributedSpace: {
    [key: string]: number;
  },
  zoneOrder: string[],
  maxColumnLimit: number,
) => {
  return redistributeSpaceWithDynamicMinWidth(
    currentDistributedSpace,
    [...zoneOrder, "spaceToAdjust"],
    -10, // Random value to indicate space adjustment
    zoneOrder.length,
    {
      maxColumnLimit,
    },
  );
};

const multiZoneSpaceDistribution = (
  zonesToAdd: string[],
  widgetsAfterUpdate: CanvasWidgetsReduxState,
  commonSpace: number,
  currentZoneOrder: string[],
  updatedDistributedSpace: { [key: string]: number },
  updatedZoneOrder: string[],
) => {
  // Calculate the total required space for all zones to be added
  const requiredSpaceForAllZones = zonesToAdd.reduce((spaceCount, eachZone) => {
    // Retrieve properties of each zone
    const zoneProps = widgetsAfterUpdate[eachZone];

    // Add the flexGrow property or use a common space value
    spaceCount += zoneProps.flexGrow || commonSpace;

    return spaceCount;
  }, 0);

  // Find the index where the first zone in zonesToAdd is currently located
  const indexToDrop = currentZoneOrder.indexOf(zonesToAdd[0]);

  // Redistribute space considering the newly added zones
  const distributedSpaceArrayOfExistingZones =
    redistributeSpaceWithDynamicMinWidth(
      updatedDistributedSpace,
      updatedZoneOrder,
      requiredSpaceForAllZones,
      indexToDrop,
      {
        currentZoneShrinkLimit: ZoneMinColumnWidth * zonesToAdd.length,
      },
    );
  const distributedSpaceOfExistingZones = updatedZoneOrder.reduce(
    (result, each, index) => {
      return {
        ...result,
        ...(distributedSpaceArrayOfExistingZones[index]
          ? { [each]: distributedSpaceArrayOfExistingZones[index] }
          : {}),
      };
    },
    {} as { [key: string]: number },
  );

  // Get the maximum allowed space for the newly added zones
  const maximumAllowedSpace = distributedSpaceArrayOfExistingZones[indexToDrop];

  // Initialize an object to store distributed space for each added zone
  const zonesToAddDistributedSpace = zonesToAdd.reduce(
    (distributedSpace, eachZone) => {
      // Retrieve properties of each zone
      const zoneProps = widgetsAfterUpdate[eachZone];

      // Set the distributed space for the zone to its flexGrow property or common space
      distributedSpace[eachZone] = zoneProps.flexGrow || commonSpace;

      return distributedSpace;
    },
    {} as { [key: string]: number },
  );

  // Handle the addition of zones and update the distributed space
  zonesToAdd.forEach((eachZone, index) => {
    updatedZoneOrder.splice(index, 0, eachZone);
  });

  // Redistribute space considering the need for space adjustment
  const updatedDistributedSpaceArray = reAdjustSpaceDistribution(
    zonesToAddDistributedSpace,
    zonesToAdd,
    maximumAllowedSpace,
  );

  // Update the distributed space for each zone based on the redistributed space array
  const updatedDistributedSpaceOfAddedZones = zonesToAdd.reduce(
    (result, each, index) => {
      return {
        ...result,
        ...(updatedDistributedSpaceArray[index]
          ? { [each]: updatedDistributedSpaceArray[index] }
          : {}),
      };
    },
    {} as { [key: string]: number },
  );

  // Merge the updated distributed space with the existing distributed space
  return {
    ...distributedSpaceOfExistingZones,
    ...updatedDistributedSpaceOfAddedZones,
  };
};

/**
 * function to update the distributed space among zones within a section.
 * @param widgetsBeforeUpdate - The state of widgets before the update.
 * @param widgetsAfterUpdate - The state of widgets after the update.
 * @param sectionWidget - The section widget that is being updated.
 * @returns {Object} - The updated state of widgets with the updated space distribution.
 */
export function* updateSectionsDistributedSpace(
  widgetsAfterUpdate: CanvasWidgetsReduxState,
  sectionWidget: FlattenedWidgetProps,
) {
  // Extracting necessary information from the section widget
  const widgetsBeforeUpdate: CanvasWidgetsReduxState = yield select(getWidgets);
  const sectionWidgetId = sectionWidget.widgetId;
  const updatedWidgets = { ...widgetsAfterUpdate };
  const childrenToUpdate = sectionWidget.children || [];
  const commonSpace = SectionColumns / childrenToUpdate.length;

  // Extracting the order of zones before and after the update
  const previousZoneOrder: string[] =
    widgetsBeforeUpdate[sectionWidgetId]?.layout[0]?.layout?.map(
      (each: WidgetLayoutProps) => each.widgetId,
    ) ?? [];
  const currentDistributedSpace =
    sectionWidget.spaceDistributed ||
    getDefaultSpaceDistributed(previousZoneOrder);
  const currentZoneOrder: string[] = sectionWidget.layout[0].layout.map(
    (each: WidgetLayoutProps) => each.widgetId,
  );

  // Identifying zones to add or remove
  const zonesToAdd = currentZoneOrder.filter(
    (each) => !previousZoneOrder.includes(each),
  );
  const zonesToRemove = previousZoneOrder.filter(
    (each) => !currentZoneOrder.includes(each),
  );

  // Initializing the object to store the updated distributed space
  let updatedDistributedSpace: { [key: string]: number } =
    currentDistributedSpace;
  let updatedZoneOrder = previousZoneOrder;

  if (zonesToRemove.length) {
    // Handling removal of zones and updating distributed space
    zonesToRemove.forEach((eachZone) => {
      const zoneProps = widgetsBeforeUpdate[eachZone];
      const index = updatedZoneOrder.indexOf(eachZone);
      const updatedDistributedSpaceArray = redistributeSpaceWithDynamicMinWidth(
        updatedDistributedSpace,
        updatedZoneOrder,
        -zoneProps.flexGrow || commonSpace,
        index,
      );

      updatedZoneOrder = updatedZoneOrder.filter((_, i) => i !== index);
      updatedDistributedSpace = updatedZoneOrder.reduce(
        (result, each, index) => {
          return {
            ...result,
            ...(updatedDistributedSpaceArray[index]
              ? { [each]: updatedDistributedSpaceArray[index] }
              : {}),
          };
        },
        {} as { [key: string]: number },
      );
    });
  }

  if (zonesToAdd.length) {
    if (zonesToAdd.length > 1) {
      updatedDistributedSpace = multiZoneSpaceDistribution(
        zonesToAdd,
        widgetsAfterUpdate,
        commonSpace,
        currentZoneOrder,
        updatedDistributedSpace,
        updatedZoneOrder,
      );
    } else {
      // Handling addition of zones and updating distributed space
      const zoneProps = widgetsAfterUpdate[zonesToAdd[0]];
      const index = currentZoneOrder.indexOf(zonesToAdd[0]);
      const updatedDistributedSpaceArray = redistributeSpaceWithDynamicMinWidth(
        updatedDistributedSpace,
        updatedZoneOrder,
        zoneProps.flexGrow || commonSpace,
        index,
      );

      updatedZoneOrder.splice(index, 0, zonesToAdd[0]);
      updatedDistributedSpace = updatedZoneOrder.reduce(
        (result, each, index) => {
          return {
            ...result,
            ...(updatedDistributedSpaceArray[index]
              ? { [each]: updatedDistributedSpaceArray[index] }
              : {}),
          };
        },
        {} as { [key: string]: number },
      );
    }
  }

  // updating individual zones new distributed space
  childrenToUpdate.forEach((eachChild: string) => {
    updatedWidgets[eachChild] = {
      ...updatedWidgets[eachChild],
      flexGrow: updatedDistributedSpace[eachChild] ?? commonSpace,
    };
  });

  // Updating the section widget with the new distributed space
  updatedWidgets[sectionWidgetId] = {
    ...updatedWidgets[sectionWidgetId],
    spaceDistributed: updatedDistributedSpace,
  };

  return updatedWidgets;
}

/**
 * function to update the space distribution within a section with the default distribution.
 * @param allWidgets - The current state of all widgets.
 * @param sectionWidget - The section widget that is being updated.
 * @returns {Object} - The updated state of widgets with the default space distribution.
 */
export function* updateSectionWithDefaultSpaceDistribution(
  allWidgets: CanvasWidgetsReduxState,
  sectionWidget: FlattenedWidgetProps,
) {
  // Extracting necessary information from the section widget
  const sectionWidgetId = sectionWidget.widgetId;
  const zoneOrder: string[] = sectionWidget.layout[0].layout.map(
    (each: WidgetLayoutProps) => each.widgetId,
  );

  // Calculating the default space distribution for the zones within the section
  const defaultSpaceDistributed = getDefaultSpaceDistributed(zoneOrder);
  const updatedWidgets = { ...allWidgets };

  // Removing previous space distribution and updating widgets
  zoneOrder.forEach((eachChild: string) => {
    updatedWidgets[eachChild] = {
      ...updatedWidgets[eachChild],
      flexGrow: defaultSpaceDistributed[eachChild],
    };
    updatedWidgets[sectionWidgetId] = {
      ...updatedWidgets[sectionWidgetId],
      spaceDistributed: {
        ...updatedWidgets[sectionWidgetId].spaceDistributed,
        [eachChild]: defaultSpaceDistributed[eachChild],
      },
    };
  });

  // Updating the section widget with the new default space distribution
  return {
    ...updatedWidgets,
    [sectionWidgetId]: {
      ...updatedWidgets[sectionWidgetId],
      spaceDistributed: defaultSpaceDistributed,
    },
  };
}

// Threshold to identify a "relatively large" zone during space redistribution
const RELATIVELY_LARGE_ZONE_THRESHOLD = 0.8;

// Threshold to determine if the smallest zone is considered "large" relative to the largest zone
const LARGE_SMALL_ZONE_THRESHOLD = 0.7;

// Threshold used to determine the minimum column width for a "large" zone relative to the largest zone
const LARGE_SMALL_ZONE_SHRINK_THRESHOLD = 0.7;

function roundOffSpaceDistributedArray(
  spaceDistributedArray: number[],
  maxColumnLimit = SectionColumns,
) {
  // Adjust for rounding errors
  const roundingError =
    maxColumnLimit -
    spaceDistributedArray.reduce((sum, value) => sum + value, 0);
  // Calculate the rounding error distribution among the zones
  const roundOffForBiggestSpace =
    roundingError !== 0 ? roundingError % spaceDistributedArray.length : 0;
  const evenDistributionSpaceWithRoundingError =
    (roundingError - roundOffForBiggestSpace) / spaceDistributedArray.length;

  // Distribute the rounding error among zones based on index position
  if (evenDistributionSpaceWithRoundingError !== 0) {
    for (let i = 0; i < spaceDistributedArray.length; i++) {
      spaceDistributedArray[i] += evenDistributionSpaceWithRoundingError;
    }
  }

  // Find the index of the zone with the biggest space
  const biggestSpaceIndex = spaceDistributedArray.indexOf(
    Math.max(...spaceDistributedArray),
  );

  // Adjust the space at the specified index for the remaining rounding error
  spaceDistributedArray[biggestSpaceIndex] += roundOffForBiggestSpace;
}

function getZoneChangeAndRelativeSize(
  spaceDistributedArray: number[],
  zoneChangeFactor: number,
  maxColumnLimit = SectionColumns,
): {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  zoneChange: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isSmallestZoneLargeRelatively: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  largestZoneSpace: any;
} {
  // Constants for determining zone sizes and thresholds
  const largestZoneThreshold =
    RELATIVELY_LARGE_ZONE_THRESHOLD *
    (maxColumnLimit / spaceDistributedArray.length);

  // Find the index of the largest zone
  const largestZoneIndex = spaceDistributedArray.findIndex(
    (each: number) =>
      each === Math.max(...spaceDistributedArray) &&
      each >= largestZoneThreshold,
  );
  const largestZoneSpace = spaceDistributedArray[largestZoneIndex];

  // Calculate the maximum space that can be added or removed without violating the minimum column width
  const smallestZone = Math.min(...spaceDistributedArray);
  const isSmallestZoneLargeRelatively =
    smallestZone > LARGE_SMALL_ZONE_THRESHOLD * largestZoneSpace;
  const spaceWelcomed = isSmallestZoneLargeRelatively
    ? Math.max(smallestZone - 2, ZoneMinColumnWidth)
    : maxColumnLimit - ZoneMinColumnWidth * spaceDistributedArray.length;
  const zoneChange =
    zoneChangeFactor >= spaceWelcomed && zoneChangeFactor > 0
      ? spaceWelcomed
      : zoneChangeFactor;

  return { zoneChange, isSmallestZoneLargeRelatively, largestZoneSpace };
}

function adjustZoneSpaces(
  spaceDistributedArray: number[],
  zoneChangeFactor: number,
  isSmallestZoneLargeRelatively: boolean,
  largestZoneSpace: number,
  newlyAdjustedValues: number[],
  index: number,
  minColumnWidth: number,
  currentZoneShrinkLimit: number,
): number[] {
  for (let i = 0; i < spaceDistributedArray.length; i++) {
    const minColumns =
      zoneChangeFactor > 0 &&
      isSmallestZoneLargeRelatively &&
      spaceDistributedArray[i] >= LARGE_SMALL_ZONE_THRESHOLD * largestZoneSpace
        ? Math.round(
            LARGE_SMALL_ZONE_SHRINK_THRESHOLD * spaceDistributedArray[i],
          )
        : index === i
          ? currentZoneShrinkLimit
          : minColumnWidth;

    const adjustedSpace = Math.max(
      Math.round(newlyAdjustedValues[i]),
      minColumns,
    );

    spaceDistributedArray[i] = adjustedSpace;
  }

  return spaceDistributedArray;
}

/**
 * Redistributes space within a section while preserving zone ratios and minimum column width.
 *
 * @param spaceDistributedObj - An object containing the current distribution of space in each zone.
 * @param zoneOrder - An array specifying the order of zones in the section.
 * @param zoneChangeFactor - The factor by which space is added or removed.
 * @param index - The index where the space is added or removed.
 * @param options - An object containing additional options for the operation.
 * @returns An array representing the redistributed space in each zone after the operation.
 */
export const redistributeSpaceWithDynamicMinWidth = (
  spaceDistributedObj: {
    [key: string]: number;
  },
  zoneOrder: string[],
  zoneChangeFactor: number,
  index: number,
  options: {
    addedViaStepper?: boolean;
    maxColumnLimit?: number;
    minColumnWidth?: number;
    currentZoneShrinkLimit?: number;
  } = {},
): number[] => {
  const {
    addedViaStepper = false,
    currentZoneShrinkLimit = ZoneMinColumnWidth,
    maxColumnLimit = SectionColumns,
    minColumnWidth = ZoneMinColumnWidth,
  } = options;
  // Extract the current distribution of space into an array
  const spaceDistributedArray = zoneOrder.map(
    (zone) => spaceDistributedObj[zone],
  );

  // Check if there is only one zone in the section
  if (spaceDistributedArray.length === 1) {
    // Delegate to the original redistribution function for a single zone
    return redistributeSectionSpace(
      spaceDistributedObj,
      zoneOrder,
      zoneChangeFactor,
      index,
      addedViaStepper,
      maxColumnLimit,
    );
  }

  // Check if the absolute value of the space change factor is less than the minimum column width
  if (Math.abs(zoneChangeFactor) < minColumnWidth) return spaceDistributedArray;

  const { isSmallestZoneLargeRelatively, largestZoneSpace, zoneChange } =
    getZoneChangeAndRelativeSize(
      spaceDistributedArray,
      zoneChangeFactor,
      maxColumnLimit,
    );

  // Calculate the space that would result in an even distribution
  const evenDistributionSpace = maxColumnLimit / spaceDistributedArray.length;
  const evenlyDistributedLayout =
    (addedViaStepper || spaceDistributedArray.length > 1) &&
    spaceDistributedArray.every((each) => each === evenDistributionSpace);

  // Add or remove space based on the calculated factors
  if (zoneChange > 0) {
    spaceDistributedArray.splice(index, 0, zoneChange);
  } else {
    spaceDistributedArray.splice(index, 1);
  }

  // Handle the case when there is only one zone left
  if (spaceDistributedArray.length === 1) {
    return [maxColumnLimit];
  }

  // Check if the layout should be evenly distributed
  if (evenlyDistributedLayout) {
    const updatedEvenDistributionSpace =
      maxColumnLimit / spaceDistributedArray.length;

    // Return an array with evenly distributed space
    return new Array(spaceDistributedArray.length).fill(
      Math.round(updatedEvenDistributionSpace),
    );
  }

  // Calculate the total existing space before the change
  const totalExistingSpace = spaceDistributedArray.reduce(
    (sum, value) => sum + value,
    0,
  );

  // Calculate the adjustment ratio to distribute space based on existing ratios
  const adjustmentRatio = maxColumnLimit / totalExistingSpace;

  // Calculate the newly adjusted values based on the adjustment ratio
  const newlyAdjustedValues = spaceDistributedArray.map(
    (value) => value * adjustmentRatio,
  );

  adjustZoneSpaces(
    spaceDistributedArray,
    zoneChangeFactor,
    isSmallestZoneLargeRelatively,
    largestZoneSpace,
    newlyAdjustedValues,
    index,
    minColumnWidth,
    currentZoneShrinkLimit,
  );
  roundOffSpaceDistributedArray(spaceDistributedArray, maxColumnLimit);

  // Return the resulting array after redistribution
  return spaceDistributedArray;
};
