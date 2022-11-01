import { MenuButtonWidgetProps, MenuItemsSource } from "../constants";

export const getSourceDataKeysForEventAutocomplete = (
  props: MenuButtonWidgetProps,
) => {
  if (props.menuItemsSource === MenuItemsSource.STATIC) {
    return;
  }

  if (!props.sourceDataKeys?.length) {
    return;
  }

  return {
    currentItem: props.sourceDataKeys.reduce(
      (prev, cur) => ({ ...prev, [cur]: "" }),
      {},
    ),
  };
};
