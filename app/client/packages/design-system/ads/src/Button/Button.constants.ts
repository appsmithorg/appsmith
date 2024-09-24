import { CLASS_NAME_PREFIX } from "../__config__/constants";

// classnames
export const ButtonClassName = CLASS_NAME_PREFIX + "-button";

export const ButtonLoadingClassName = ButtonClassName + "__loading";
export const ButtonLoadingIconClassName = ButtonLoadingClassName + "-icon";

export const ButtonContentClassName = ButtonClassName + "__content";
export const ButtonContentChildrenClassName =
  ButtonContentClassName + "-children";
export const ButtonContentIconStartClassName =
  ButtonContentClassName + "-icon-start";
export const ButtonContentIconEndClassName =
  ButtonContentClassName + "-icon-end";
