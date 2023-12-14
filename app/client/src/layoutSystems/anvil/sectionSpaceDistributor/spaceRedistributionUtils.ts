import type {
  CanvasWidgetsReduxState,
  FlattenedWidgetProps,
} from "reducers/entityReducers/canvasWidgetsReducer";
import { SectionColumns, ZoneMinColumnWidth } from "../utils/constants";
import type { WidgetLayoutProps } from "../utils/anvilTypes";

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
    SectionColumns - ZoneMinColumnWidth * spaceDistributedArray.length;

  // Determine the actual change considering the maximum space and direction of change
  const zoneChange =
    zoneChangeFactor > spaceWelcomed && zoneChangeFactor > 0
      ? spaceWelcomed
      : zoneChangeFactor;

  // Calculate the even distribution space for comparison
  const evenDistributionSpace = SectionColumns / spaceDistributedArray.length;

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
      SectionColumns / spaceDistributedArray.length;
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

/**
 * function to update the distributed space among zones within a section.
 * @param widgetsBeforeUpdate - The state of widgets before the update.
 * @param widgetsAfterUpdate - The state of widgets after the update.
 * @param sectionWidget - The section widget that is being updated.
 * @returns {Object} - The updated state of widgets with the updated space distribution.
 */
export function* updateSectionsDistributedSpace(
  widgetsBeforeUpdate: CanvasWidgetsReduxState,
  widgetsAfterUpdate: CanvasWidgetsReduxState,
  sectionWidget: FlattenedWidgetProps,
) {
  // Extracting necessary information from the section widget
  const sectionWidgetId = sectionWidget.widgetId;
  const updatedWidgets = { ...widgetsAfterUpdate };
  const childrenToUpdate = sectionWidget.children || [];
  const commonSpace = SectionColumns / childrenToUpdate.length;

  // Extracting the order of zones before and after the update
  const previousZoneOrder: string[] = sectionWidget.layout[0].layout.map(
    (each: WidgetLayoutProps) => each.widgetId,
  );
  const currentDistributedSpace =
    sectionWidget.spaceDistributed ||
    getDefaultSpaceDistributed(previousZoneOrder);
  const updatedZoneOrder: string[] = sectionWidget.layout[0].layout.map(
    (each: WidgetLayoutProps) => each.widgetId,
  );

  // Identifying zones to add or remove
  const zonesToAdd = updatedZoneOrder.filter(
    (each) => !previousZoneOrder.includes(each),
  );
  const zonesToRemove = previousZoneOrder.filter(
    (each) => !updatedZoneOrder.includes(each),
  );

  // Initializing the object to store the updated distributed space
  let updatedDistributedSpace: { [key: string]: number } = {};

  // Handling removal of zones and updating distributed space
  zonesToRemove.forEach((eachZone) => {
    const zoneProps = widgetsBeforeUpdate[eachZone];
    const index = previousZoneOrder.indexOf(eachZone);
    const updatedDistributedSpaceArray = redistributeSpaceWithDynamicMinWidth(
      currentDistributedSpace,
      previousZoneOrder,
      -zoneProps.flexGrow || commonSpace,
      index,
    );
    updatedDistributedSpace = updatedZoneOrder.reduce(
      (result, each, index) => {
        return {
          ...result,
          [each]: updatedDistributedSpaceArray[index],
        };
      },
      {} as { [key: string]: number },
    );
  });

  // Handling addition of zones and updating distributed space
  zonesToAdd.forEach((eachZone) => {
    const zoneProps = widgetsAfterUpdate[eachZone];
    const index = updatedZoneOrder.indexOf(eachZone);
    const updatedDistributedSpaceArray = redistributeSpaceWithDynamicMinWidth(
      currentDistributedSpace,
      previousZoneOrder,
      zoneProps.flexGrow || commonSpace,
      index,
    );
    updatedDistributedSpace = updatedZoneOrder.reduce(
      (result, each, index) => {
        return {
          ...result,
          [each]: updatedDistributedSpaceArray[index],
        };
      },
      {} as { [key: string]: number },
    );
  });

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

/**
 * Redistributes space within a section while preserving zone ratios and minimum column width.
 *
 * @param spaceDistributedObj - An object containing the current distribution of space in each zone.
 * @param zoneOrder - An array specifying the order of zones in the section.
 * @param zoneChangeFactor - The factor by which space is added or removed.
 * @param index - The index where the space is added or removed.
 * @param addedViaStepper - A flag indicating whether the space change is initiated via a stepper.
 * @returns An array representing the redistributed space in each zone after the operation.
 */
export const redistributeSpaceWithDynamicMinWidth = (
  spaceDistributedObj: {
    [key: string]: number;
  },
  zoneOrder: string[],
  zoneChangeFactor: number,
  index: number,
  addedViaStepper?: boolean,
): number[] => {
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
    );
  }

  // Check if the absolute value of the space change factor is less than the minimum column width
  if (Math.abs(zoneChangeFactor) < ZoneMinColumnWidth)
    return spaceDistributedArray;

  // Constants for determining zone sizes and thresholds
  const largestZoneThreshold =
    RELATIVELY_LARGE_ZONE_THRESHOLD *
    (SectionColumns / spaceDistributedArray.length);

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
    : SectionColumns - ZoneMinColumnWidth * spaceDistributedArray.length;
  const zoneChange =
    zoneChangeFactor >= spaceWelcomed && zoneChangeFactor > 0
      ? spaceWelcomed
      : zoneChangeFactor;

  // Calculate the space that would result in an even distribution
  const evenDistributionSpace = SectionColumns / spaceDistributedArray.length;
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
    return [SectionColumns];
  }

  // Check if the layout should be evenly distributed
  if (evenlyDistributedLayout) {
    const updatedEvenDistributionSpace =
      SectionColumns / spaceDistributedArray.length;

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
  const adjustmentRatio = SectionColumns / totalExistingSpace;

  // Calculate the newly adjusted values based on the adjustment ratio
  const newlyAdjustedValues = spaceDistributedArray.map(
    (value) => value * adjustmentRatio,
  );

  // Iterate over each zone and ensure each number is not less than ZoneMinColumnWidth
  for (let i = 0; i < spaceDistributedArray.length; i++) {
    const minColumns =
      zoneChangeFactor > 0 &&
      isSmallestZoneLargeRelatively &&
      spaceDistributedArray[i] >= LARGE_SMALL_ZONE_THRESHOLD * largestZoneSpace
        ? Math.round(
            LARGE_SMALL_ZONE_SHRINK_THRESHOLD * spaceDistributedArray[i],
          )
        : ZoneMinColumnWidth;
    const adjustedSpace = Math.max(
      Math.round(newlyAdjustedValues[i]),
      minColumns,
    );
    spaceDistributedArray[i] = adjustedSpace;
  }

  // Adjust for rounding errors
  const roundingError =
    SectionColumns -
    spaceDistributedArray.reduce((sum, value) => sum + value, 0);

  // Calculate the rounding error distribution among the zones
  const roundOffForBiggestSpace =
    roundingError !== 0
      ? roundingError % (spaceDistributedArray.length - 1)
      : 0;
  const evenDistributionSpaceWithRoundingError =
    (roundingError - roundOffForBiggestSpace) /
    (spaceDistributedArray.length - 1);

  // Distribute the rounding error among zones based on index position
  if (evenDistributionSpaceWithRoundingError > 0) {
    for (let i = 0; i < spaceDistributedArray.length; i++) {
      if (i !== index) {
        spaceDistributedArray[i] += evenDistributionSpaceWithRoundingError;
      }
    }
  }

  // Find the index of the zone with the biggest space
  const biggestSpaceIndex = spaceDistributedArray.indexOf(
    Math.max(...spaceDistributedArray),
  );

  // Adjust the space at the specified index for the remaining rounding error
  spaceDistributedArray[biggestSpaceIndex] += roundOffForBiggestSpace;

  // Return the resulting array after redistribution
  return spaceDistributedArray;
};
