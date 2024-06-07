import { BUTTON_VARIANTS, COLORS, objectKeys } from "@design-system/widgets";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  label: "Open The Menu…",
  triggerButtonVariant: objectKeys(BUTTON_VARIANTS)[0],
  triggerButtonColor: COLORS.accent,
  isCompact: false,
  isDisabled: false,
  isVisible: true,
  animateLoading: true,
  menuItemsSource: "static",
  menuItems: {
    menuItem1: {
      label: "Bake",
      id: "menuItem1",
      widgetId: "",
      isVisible: true,
      isDisabled: false,
      index: 0,
    },
    menuItem2: {
      label: "Fry",
      id: "menuItem2",
      widgetId: "",
      isVisible: true,
      isDisabled: false,
      index: 1,
    },
    menuItem3: {
      label: "Boil",
      id: "menuItem3",
      widgetId: "",
      isVisible: true,
      isDisabled: false,
      index: 2,
    },
  },
  widgetName: "MenuButton",
  version: 1,
} as unknown as WidgetDefaultProps;
