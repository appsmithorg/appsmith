import { BUTTON_VARIANTS, COLORS, objectKeys } from "@design-system/widgets";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  iconName: "plus",
  buttonVariant: objectKeys(BUTTON_VARIANTS)[0],
  buttonColor: COLORS.accent,
  isDisabled: false,
  isVisible: true,
  widgetName: "IconButton",
  version: 1,
  animateLoading: true,
  responsiveBehavior: ResponsiveBehavior.Hug,
};
