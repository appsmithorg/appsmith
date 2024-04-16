import { BUTTON_VARIANTS, COLORS, ICONS } from "@design-system/widgets";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  iconName: ICONS.plus,
  buttonVariant: BUTTON_VARIANTS.filled,
  buttonColor: COLORS.accent,
  isDisabled: false,
  isVisible: true,
  widgetName: "IconButton",
  version: 1,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Hug,
};
