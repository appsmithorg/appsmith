import { BUTTON_VARIANTS, COLORS } from "@design-system/widgets";
import { IconNames } from "@blueprintjs/icons";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { ICON_BUTTON_MIN_WIDTH } from "constants/minWidthConstants";

export const defaultsConfig = {
  iconName: IconNames.PLUS,
  buttonVariant: BUTTON_VARIANTS.filled,
  buttonColor: COLORS.accent,
  isDisabled: false,
  isVisible: true,
  rows: 4,
  columns: 4,
  widgetName: "IconButton",
  version: 1,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Hug,
  minWidth: ICON_BUTTON_MIN_WIDTH,
};
