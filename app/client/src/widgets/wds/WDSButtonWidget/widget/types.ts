import type { RecaptchaType } from "components/constants";
import type { WidgetProps, WidgetState } from "widgets/BaseWidget";

import type { ButtonComponentProps } from "../component";

export interface ButtonWidgetState extends WidgetState {
  isLoading: boolean;
}

export interface ButtonWidgetProps
  extends WidgetProps,
    Omit<ButtonComponentProps, "type" | "onClick"> {
  text?: string;
  isVisible?: boolean;
  isDisabled?: boolean;
  resetFormOnClick?: boolean;
  googleRecaptchaKey?: string;
  recaptchaType?: RecaptchaType;
  disabledWhenInvalid?: boolean;
  onClick?: string;
}
