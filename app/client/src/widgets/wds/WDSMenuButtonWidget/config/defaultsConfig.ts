import { BUTTON_VARIANTS, COLORS } from "@design-system/widgets";

export const defaultsConfig = {
  label: "Open Menu",
  triggerButtonVariant: BUTTON_VARIANTS.filled,
  triggerButtonColor: COLORS.accent,
  isCompact: false,
  isDisabled: false,
  isVisible: true,
  animateLoading: true,
  menuItemsSource: "static",
  menuItems: {
    menuItem1: {
      label: "First Menu Item",
      id: "menuItem1",
      widgetId: "",
      isVisible: true,
      isDisabled: false,
      index: 0,
    },
    menuItem2: {
      label: "Second Menu Item",
      id: "menuItem2",
      widgetId: "",
      isVisible: true,
      isDisabled: false,
      index: 1,
    },
    menuItem3: {
      label: "Third Menu Item",
      id: "menuItem3",
      widgetId: "",
      isVisible: true,
      isDisabled: false,
      index: 2,
    },
  },
  rows: 4,
  columns: 16,
  widgetName: "MenuButton",
  version: 1,
};
