import type { MenuButtonWidgetProps } from "../widget/types";
import { isArray } from "lodash";

export const updateMenuItemsSource = (
  props: MenuButtonWidgetProps,
  propertyPath: string,
  propertyValue: unknown,
): Array<{ propertyPath: string; propertyValue: unknown }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: unknown;
  }> = [];
  const isMenuItemsSourceChangedFromStaticToDynamic =
    props.menuItemsSource === "static" && propertyValue === "dynamic";

  if (isMenuItemsSourceChangedFromStaticToDynamic) {
    if (!props.sourceData) {
      propertiesToUpdate.push({
        propertyPath: "sourceData",
        propertyValue: [],
      });
    }

    if (!props.configureMenuItems) {
      propertiesToUpdate.push({
        propertyPath: "configureMenuItems",
        propertyValue: {
          label: "Configure menu items",
          id: "config",
          config: {
            id: "config",
            label: "Menu Item",
            isVisible: true,
            isDisabled: false,
          },
        },
      });
    }
  }

  return propertiesToUpdate.length ? propertiesToUpdate : undefined;
};

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
