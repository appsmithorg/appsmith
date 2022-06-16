import cx from "classnames";

import { ButtonProps, VariantTypes } from "./";
import { getAccentHoverColor, getOnAccentColor } from "../utils/colorHelpers";

enum ColorSchemeTypes {
  default = "default",
  disabled = "disabled",
}

export const getBaseStyles = (props: ButtonProps) => {
  return cx({
    "flex min-h-8 items-center justify-center text-center gap-1 border cursor-pointer ring-2 ring-transparent outline-none overflow-hidden w-full h-full rounded-[var(--wds-radii)]": true,
    "cursor-not-allowed": props.isDisabled,
  });
};

export const getCSSVariables = (
  props: ButtonProps,
  colorSchemeName: keyof typeof ColorSchemeTypes = "default",
): { [key: string]: string } => {
  const { borderRadius, buttonColor: accentColor, isDisabled } = props;

  const colorSchemes: any = {
    default: {
      "--wds-btn-color-bg-accent": accentColor,
      "--wds-btn-color-bg-accent-hover": getAccentHoverColor(accentColor),
      "--wds-btn-color-text-accent": accentColor,
      "--wds-btn-color-text-onaccent": getOnAccentColor(accentColor),
      "--wds-btn-color-border-accent": accentColor,
    },
    disabled: {
      "--wds-color-bg-hover": "initial",
      "--wds-color-border": "var(--wds-color-border-disabled)",
      "--wds-btn-color-bg-accent": "var(--wds-color-bg-disabled)",
      "--wds-btn-color-bg-accent-hover": "var(--wds-color-bg-disabled)",
      "--wds-btn-color-text-accent": "var(--wds-color-text-disabled)",
      "--wds-btn-color-border-accent": "var(--wds-color-bg-disabled)",
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
    colorScheme["--wds-radii"] = borderRadius;
  }

  return colorScheme;
};

/**
 * get variant styles
 *
 * @param {*} variant
 * @returns
 */
export const getVariantStyles = (
  variant: keyof typeof VariantTypes = "solid",
): string => {
  const styles = {
    solid: `bg-[color:var(--wds-btn-color-bg-accent)] text-[color:var(--wds-btn-color-text-onaccent)] border-[color:var(--wds-btn-color-border-accent)] hover:bg-[color:var(--wds-btn-color-bg-accent-hover)]`,
    outline: `border-[color:var(--wds-color-border)] text-[color:var(--wds-btn-color-text-accent)] hover:bg-[color:var(--wds-color-bg-hover)]`,
    ghost: `border-transparent text-[color:var(--color-text-accent)] hover:bg-[color:var(--color-bg-light)] bg-opacity-40 focus-visible:ring-[color:var(--color-border)]`,
    link: `border-transparent text-[color:var(--color-text-accent)] hover:bg-[color:var(--color-bg-light)] bg-opacity-40 focus-visible:ring-[color:var(--color-border)]`,
  };

  return styles[variant];
};

export const getButtonStyles = (props: ButtonProps) => {
  return `${getBaseStyles(props)}`;
};
