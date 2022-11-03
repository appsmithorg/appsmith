import { MenuButtonWidgetProps, MenuItemsSource } from "../../constants";
import { getSourceDataKeys } from "../helper";

export const updateMenuItemsSource = (
  props: MenuButtonWidgetProps,
  propertyPath: string,
  propertyValue: any,
): Array<{ propertyPath: string; propertyValue: any }> | undefined => {
  const propertiesToUpdate: Array<{
    propertyPath: string;
    propertyValue: any;
  }> = [
    {
      propertyPath,
      propertyValue,
    },
  ];
  const isMenuItemsSourceChangedFromStaticToDynamic =
    props.menuItemsSource === MenuItemsSource.STATIC &&
    propertyValue === MenuItemsSource.DYNAMIC;

  if (isMenuItemsSourceChangedFromStaticToDynamic) {
    if (!props.sourceData) {
      propertiesToUpdate.push({
        propertyPath: "sourceData",
        propertyValue: [],
      });
      propertiesToUpdate.push({
        propertyPath: "sourceDataKeys",
        propertyValue: getSourceDataKeys(props),
      });
    }

    if (!props.configureMenuItems) {
      propertiesToUpdate.push({
        propertyPath: "configureMenuItems",
        propertyValue: {
          label: "Configure Menu Items",
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

  return propertiesToUpdate;
};
