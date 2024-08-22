import { RecaptchaTypes } from "components/constants";
import {
  BUTTON_WIDGET_DEFAULT_LABEL,
  createMessage,
} from "ee/constants/messages";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";

import { BUTTON_VARIANTS, COLORS, objectKeys } from "@appsmith/wds";

export const defaultsConfig = {
  animateLoading: true,
  text: createMessage(BUTTON_WIDGET_DEFAULT_LABEL),
  buttonVariant: objectKeys(BUTTON_VARIANTS)[0],
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
