import cx from "classnames";

import { ButtonProps, VariantTypes } from "./";
import { getAccentHoverColor, getOnAccentColor } from "../utils/colorHelpers";
import styles from "./styles.module.css";

enum ColorSchemeTypes {
  default = "default",
  disabled = "disabled",
}

export const getCSSVariables = (
  props: ButtonProps,
  colorSchemeName: keyof typeof ColorSchemeTypes = "default",
): { [key: string]: string } => {
  const {
    borderRadius,
    boxShadow,
    buttonColor: accentColor,
    isDisabled,
  } = props;

  const colorSchemes: any = {
    default: {
      "--wds-btn-color-bg-accent": accentColor,
      "--wds-btn-color-bg-accent-hover": getAccentHoverColor(accentColor),
      "--wds-btn-color-text-accent": accentColor,
      "--wds-btn-color-text-onaccent": getOnAccentColor(accentColor),
      "--wds-btn-color-border-accent": accentColor,
    },
    disabled: {
      "--wds-color-border": "var(--wds-color-border-disabled)",
      "--wds-btn-color-bg-accent": "var(--wds-color-bg-disabled)",
      "--wds-btn-color-text-accent": "var(--wds-color-text-disabled)",
      "--wds-btn-color-border-accent": "var(--wds-color-bg-disabled)",
      "--wds-btn-color-text": "var(--wds-color-text-disabled)",
      "--wds-btn-color-text-onaccent": "var(--wds-color-text)",
      "--wds-btn-color-border-accent-strong":
        "var(--wds-color-border-disabled-strong)",
    },
  };

  let colorScheme = colorSchemes[colorSchemeName];

  if (isDisabled) {
    colorScheme = colorSchemes["disabled"];
  }

  if (borderRadius) {
    colorScheme["--wds-radii"] = borderRadius || "0px";
  }

  if (boxShadow) {
    colorScheme["--wds-shadow"] = boxShadow || "none";
  }

  return colorScheme;
};
