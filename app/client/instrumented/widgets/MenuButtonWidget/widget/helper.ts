import { isArray } from "lodash";

export const getKeysFromSourceDataForEventAutocomplete = (
  sourceData?: Array<Record<string, unknown>> | unknown,
) => {
  if (isArray(sourceData) && sourceData?.length) {
    const keys = getUniqueKeysFromSourceData(sourceData);

    return {
      currentItem: keys.reduce((prev, cur) => ({ ...prev, [cur]: "" }), {}),
    };
  } else {
    return { currentItem: {} };
  }
};

export const getUniqueKeysFromSourceData = (
  sourceData?: Array<Record<string, unknown>>,
) => {
  if (!isArray(sourceData) || !sourceData?.length) {
    return [];
  }

  const allKeys: string[] = [];

  // get all keys
  sourceData?.forEach((item) => {
    if (item) {
      if (isArray(item) && item?.length) {
        item.forEach((subItem) => {
          allKeys.push(...Object.keys(subItem));
        });
      } else {
        allKeys.push(...Object.keys(item));
      }
    }
  });

  // return unique keys
  const uniqueKeys = [...new Set(allKeys)];

  return uniqueKeys;
};
