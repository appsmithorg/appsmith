import { RecaptchaTypes } from "components/constants";
import { COLORS, BUTTON_VARIANTS } from "@design-system/widgets";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

export const defaultsConfig = {
  animateLoading: true,
  text: "Do something",
  buttonVariant: BUTTON_VARIANTS.filled,
  buttonColor: COLORS.accent,
  widgetName: "Button",
  isDisabled: false,
  isVisible: true,
  disabledWhenInvalid: false,
  resetFormOnClick: false,
  recaptchaType: RecaptchaTypes.V3,
  version: 1,
  responsiveBehavior: ResponsiveBehavior.Hug,
};
