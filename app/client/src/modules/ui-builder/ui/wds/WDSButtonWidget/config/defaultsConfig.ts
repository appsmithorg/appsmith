import { RecaptchaTypes } from "components/constants";
import { COLORS, BUTTON_VARIANTS } from "@appsmith/wds";
import { ResponsiveBehavior } from "layoutSystems/common/utils/constants";
import { objectKeys } from "@appsmith/utils";
import {
  BUTTON_WIDGET_DEFAULT_LABEL,
  createMessage,
} from "ee/constants/messages";

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
