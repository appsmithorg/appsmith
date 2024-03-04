import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  widgetName: "ToolbarButtons",
  orientation: "horizontal",
  buttonVariant: "filled",
  buttonColor: "accent",
  isDisabled: false,
  isVisible: true,
  version: 1,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  buttonsList: {
    button1: {
      label: "Favorite",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button1",
      index: 0,
      iconName: "heart",
      iconAlign: "start",
    },
    button2: {
      label: "Add",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button2",
      index: 1,
      iconName: "plus",
      iconAlign: "start",
    },
    button3: {
      label: "Bookmark",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button3",
      index: 2,
      iconName: "bookmark",
      iconAlign: "start",
    },
  },
} as unknown as WidgetDefaultProps;
