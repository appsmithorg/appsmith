import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import type { WidgetDefaultProps } from "WidgetProvider/constants";

export const defaultsConfig = {
  widgetName: "InlineButtons",
  isDisabled: false,
  isVisible: true,
  version: 1,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  buttonsList: {
    button1: {
      label: "Delete",
      isVisible: true,
      isDisabled: false,
      id: "button1",
      index: 0,
      variant: "outlined",
      color: "negative",
    },
    button2: {
      label: "Separator",
      isVisible: true,
      isDisabled: false,
      id: "button2",
      isSeparator: true,
      index: 1,
      itemType: "SEPARATOR",
    },
    button3: {
      label: "Cancel",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button3",
      index: 2,
      variant: "outlined",
      color: "accent",
    },
    button4: {
      label: "Save Changes",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button4",
      index: 3,
      variant: "filled",
      color: "accent",
    },
  },
} as unknown as WidgetDefaultProps;
