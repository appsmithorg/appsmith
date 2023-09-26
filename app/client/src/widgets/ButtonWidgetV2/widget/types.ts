import type { RecaptchaType } from "components/constants";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";

import type { ButtonComponentProps } from "../component";

export interface ButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export interface ButtonWidgetProps extends WidgetProps {
  text?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  resetFormOnClick?: boolean;
  googleRecaptchaKey?: string;
  recaptchaType?: RecaptchaType;
  disabledWhenInvalid?: boolean;
  buttonType?: ButtonComponentProps["type"];
  iconName?: ButtonComponentProps["iconName"];
  buttonVariant?: ButtonComponentProps["variant"];
  iconAlign?: ButtonComponentProps["iconPosition"];
  buttonColor?: ButtonComponentProps["color"];
}
