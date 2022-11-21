import { isArray } from "lodash";
import { MenuButtonWidgetProps, MenuItemsSource } from "../constants";

export const getSourceDataKeysForEventAutocomplete = (
  props: MenuButtonWidgetProps,
) => {
  if (
    props.menuItemsSource === MenuItemsSource.STATIC ||
    !props.sourceDataKeys?.length
  ) {
    return;
  }

  return {
    currentItem: props.sourceDataKeys.reduce(
      (prev, cur) => ({ ...prev, [cur]: "" }),
      {},
    ),
  };
};

export const getSourceDataKeys = (props: MenuButtonWidgetProps) => {
  if (!isArray(props.sourceData) || !props.sourceData?.length) {
    return [];
  }

  const allKeys: string[] = [];

  // get all keys
  props.sourceData?.forEach((item) => allKeys.push(...Object.keys(item)));

  // return unique keys
  return [...new Set(allKeys)];
};
