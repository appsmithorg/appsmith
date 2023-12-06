import { SectionColumns } from "../utils/constants";

export const redistributeSectionSpace = (
  spaceDistributedObj: {
    [key: string]: number;
  },
  zoneOrder: string[],
  zoneChangeFactor: number,
  index: number,
  addedViaStepper?: boolean,
): number[] => {
  const spaceDistributedArray = zoneOrder.map(
    (zone) => spaceDistributedObj[zone],
  );
  if (Math.abs(zoneChangeFactor) < 2) return spaceDistributedArray;
  const spaceWelcomed = 12 - 2 * spaceDistributedArray.length;
  const zoneChange =
    zoneChangeFactor > spaceWelcomed ? spaceWelcomed : zoneChangeFactor;
  const evenDistributionSpace = 12 / spaceDistributedArray.length;
  const evenlyDistributedLayout =
    (addedViaStepper || spaceDistributedArray.length > 1) &&
    spaceDistributedArray.every((each) => each === evenDistributionSpace);
  if (evenlyDistributedLayout) {
    const updatedEvenDistributionSpace =
      12 / (spaceDistributedArray.length + 1);
    return new Array(spaceDistributedArray.length + 1).fill(
      updatedEvenDistributionSpace,
    );
  }
  const isAddingZone = zoneChange > 0;
  if (isAddingZone) {
    spaceDistributedArray.splice(index, 0, zoneChange);
  } else {
    spaceDistributedArray.splice(index, 1);
  }
  let leftIndex = index - 1;
  let rightIndex = isAddingZone ? index + 1 : index;
  let spaceRightNow = spaceDistributedArray.reduce(
    (result, each) => each + result,
    0,
  );
  const changeFactor = isAddingZone ? -1 : 1;
  while (spaceRightNow !== 12) {
    if (leftIndex !== -1) {
      if (spaceDistributedArray[leftIndex] + changeFactor < 2) {
        --leftIndex;
        continue;
      }
      spaceDistributedArray[leftIndex] += changeFactor;
      spaceRightNow += changeFactor;
    }
    if (spaceRightNow === 12) {
      break;
    }
    if (rightIndex !== spaceDistributedArray.length) {
      if (spaceDistributedArray[rightIndex] + changeFactor < 2) {
        ++rightIndex;
        continue;
      }
      spaceDistributedArray[rightIndex] += changeFactor;
      spaceRightNow += changeFactor;
    }
    if (spaceRightNow === 12) {
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
