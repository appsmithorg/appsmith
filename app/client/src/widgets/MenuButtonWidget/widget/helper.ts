import { isArray } from "lodash";
import { MenuButtonWidgetProps } from "../constants";

export const getKeysFromSourceDataForEventAutocomplete = (
  props: MenuButtonWidgetProps,
) => {
  const { __evaluation__: evaluation } = props;

  if (
    isArray(evaluation?.evaluatedValues?.sourceData) &&
    evaluation?.evaluatedValues?.sourceData?.length
  ) {
    const keys = getUniqueKeysFromSourceData(
      evaluation.evaluatedValues.sourceData,
    );

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
  sourceData?.forEach((item) => allKeys.push(...Object.keys(item)));

  // return unique keys
  const uniqueKeys = [...new Set(allKeys)];

  return uniqueKeys.length ? uniqueKeys : [];
};
