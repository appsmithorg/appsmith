import { MenuButtonWidgetProps, MenuItemsSource } from "../constants";

export const getAutocompleteProperties = (props: MenuButtonWidgetProps) => {
  if (props.menuItemsSource === MenuItemsSource.STATIC) {
    return;
  }

  if (!props.sourceDataKeys?.length) {
    return;
  }

  return {
    currentItem: Object.assign(
      {},
      ...props.sourceDataKeys.map((key) => ({
        [key]: "",
      })),
    ),
  };
};
