import { RecaptchaTypes } from "components/constants";
import { COLORS, BUTTON_VARIANTS } from "@design-system/widgets";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import {
  BUTTON_WIDGET_DEFAULT_LABEL,
  createMessage,
} from "@appsmith/constants/messages";

export const defaultsConfig = {
  animateLoading: true,
  text: createMessage(BUTTON_WIDGET_DEFAULT_LABEL),
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
