import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import { BUTTON_VARIANTS, COLORS, objectKeys } from "@appsmith/wds";

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
