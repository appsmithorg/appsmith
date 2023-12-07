import { SectionColumns, ZoneMinColumnWidth } from "../utils/constants";

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
  if (Math.abs(zoneChangeFactor) < ZoneMinColumnWidth)
    return spaceDistributedArray;
  const spaceWelcomed =
    SectionColumns - ZoneMinColumnWidth * spaceDistributedArray.length;
  const zoneChange =
    zoneChangeFactor > spaceWelcomed ? spaceWelcomed : zoneChangeFactor;
  const evenDistributionSpace = SectionColumns / spaceDistributedArray.length;
  const evenlyDistributedLayout =
    (addedViaStepper || spaceDistributedArray.length > 1) &&
    spaceDistributedArray.every((each) => each === evenDistributionSpace);
  const isAddingZone = zoneChange > 0;
  if (isAddingZone) {
    spaceDistributedArray.splice(index, 0, zoneChange);
  } else {
    spaceDistributedArray.splice(index, 1);
  }
  if (evenlyDistributedLayout) {
    const updatedEvenDistributionSpace =
      SectionColumns / spaceDistributedArray.length;
    return new Array(spaceDistributedArray.length).fill(
      updatedEvenDistributionSpace,
    );
  }
  let leftIndex = index - 1;
  let rightIndex = isAddingZone ? index + 1 : index;
  let spaceRightNow = spaceDistributedArray.reduce(
    (result, each) => each + result,
    0,
  );
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
