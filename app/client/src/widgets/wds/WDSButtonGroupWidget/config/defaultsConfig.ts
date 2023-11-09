import {
  BUTTON_GROUP_ORIENTATIONS,
  BUTTON_VARIANTS,
  COLORS,
} from "@design-system/widgets";
import { IconNames } from "@blueprintjs/icons";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import {
  BUTTON_MIN_WIDTH,
  FILL_WIDGET_MIN_WIDTH,
} from "constants/minWidthConstants";

export const defaultsConfig = {
  rows: 4,
  columns: 24,
  widgetName: "ButtonGroup",
  orientation: BUTTON_GROUP_ORIENTATIONS.horizontal,
  buttonVariant: BUTTON_VARIANTS.filled,
  buttonColor: COLORS.accent,
  isDisabled: false,
  isVisible: true,
  version: 1,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Fill,
  minWidth: FILL_WIDGET_MIN_WIDTH,
  buttonsList: {
    button1: {
      label: "Favorite",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button1",
      index: 0,
      iconName: IconNames.HEART,
      iconAlign: "start",
      minWidth: BUTTON_MIN_WIDTH,
    },
    button2: {
      label: "Add",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button2",
      index: 1,
      iconName: IconNames.ADD,
      iconAlign: "start",
      minWidth: BUTTON_MIN_WIDTH,
    },
    button3: {
      label: "More",
      isVisible: true,
      isDisabled: false,
      widgetId: "",
      id: "button3",
      index: 2,
      iconName: IconNames.MORE,
      iconAlign: "start",
      minWidth: BUTTON_MIN_WIDTH,
    },
  },
};
