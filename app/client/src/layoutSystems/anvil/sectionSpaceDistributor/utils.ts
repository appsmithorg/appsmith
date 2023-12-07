import { SectionColumns, ZoneMinColumnWidth } from "../utils/constants";

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

export const getDefaultSpaceDistributed = (zones: string[]) => {
  return zones.reduce(
    (distributedSpace, each: string) => {
      distributedSpace[each] = SectionColumns / zones.length;
      return distributedSpace;
    },
    {} as { [key: string]: number },
  );
};
