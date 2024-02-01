import { css } from "@emotion/css";
import kebabCase from "lodash/kebabCase";

import type { FlexCssProps, CssVarValues, FlexProps } from "./types";

export const flexCss = (props: FlexCssProps) => {
  const { isInner, ...rest } = props;

  return css`
    ${Object.keys(rest).reduce(
      (styles, key) =>
        styles + flexStyles(key, props[key as keyof FlexCssProps], { isInner }),
      "",
    )}
  `;
};

const flexStyles = (
  cssProp: string,
  value: FlexCssProps[keyof FlexCssProps],
  extraProps?: Pick<FlexProps, "isInner">,
): string => {
  if (value == null) return "";

  switch (true) {
    case cssProp === "wrap":
      return `
        ${containerDimensionStyles<FlexCssProps["wrap"]>(
          "flex-wrap",
          value as FlexCssProps["wrap"],
          flexWrapValue,
        )};
      `;
    case cssProp === "isHidden":
      return `
        ${containerDimensionStyles<FlexCssProps["isHidden"]>(
          "display",
          value as FlexCssProps["isHidden"],
          hiddenValue,
        )};
      `;
    case cssProp === "align-items":
      return `
        ${containerDimensionStyles<FlexCssProps["alignItems"]>(
          "align-items",
          value as FlexCssProps["alignItems"],
          alignItemsValue,
        )};
      `;
    case cssProp === "direction":
      return `
        ${containerDimensionStyles("flex-direction", value)};
      `;
    case cssProp === "gap" ||
      cssProp === "flexBasis" ||
      cssProp === "margin" ||
      cssProp === "marginLeft" ||
      cssProp === "marginRight" ||
      cssProp === "marginTop" ||
      cssProp === "padding" ||
      cssProp === "paddingLeft" ||
      cssProp === "paddingRight" ||
      cssProp === "paddingTop" ||
      cssProp === "paddingBottom" ||
      cssProp === "marginBottom" ||
      cssProp === "width" ||
      cssProp === "height" ||
      cssProp === "minWidth" ||
      cssProp === "minHeight" ||
      cssProp === "maxWidth" ||
      cssProp === "maxHeight":
      return `
        ${containerDimensionStyles<CssVarValues>(
          kebabCase(cssProp),
          value as CssVarValues,
          cssVarValue,
          extraProps,
        )};
      `;
    default:
      return `
        ${containerDimensionStyles(kebabCase(cssProp), value)};
      `;
  }
};

export const containerDimensionStyles = <T = FlexCssProps[keyof FlexCssProps]>(
  cssProp: string,
  value: T,
  callback?: (value: T, extraProps?: Pick<FlexProps, "isInner">) => void,
  extraProps?: Pick<FlexProps, "isInner">,
) => {
  if (value == null) return;

  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value).reduce((prev, current) => {
      if (current !== "base") {
        return (
          prev +
          `@container (min-width: ${current}) {& {
          ${cssProp}: ${
            //@ts-expect-error: type mismatch
            callback ? callback(value[current], extraProps) : value[current]
          };}}`
        );
      } else {
        return (
          prev +
          `${cssProp}: ${
            //@ts-expect-error: type mismatch
            callback ? callback(value[current], extraProps) : value[current]
          };`
        );
      }
    }, "");
  }

  return `${cssProp}: ${callback ? callback(value, extraProps) : value};`;
};

const alignItemsValue = (value: FlexCssProps["alignItems"]) => {
  if (value === "start") {
    return "flex-start";
  }

  if (value === "end") {
    return "flex-end";
  }

  return value;
};

export const flexWrapValue = (value: FlexCssProps["wrap"]) => {
  if (typeof value === "boolean") {
    return value ? "wrap" : "nowrap";
  }

  return value;
};

const cssVarValue = (
  value: CssVarValues,
  extraProps?: Pick<FlexProps, "isInner">,
) => {
  const isInner = Boolean(extraProps?.isInner);

  if (value == null) return;

  if ((value as string).includes("sizing")) {
    return `var(--${value})`;
  }

  if ((value as string).includes("spacing") && !isInner) {
    return `var(--outer-${value})`;
  }

  if ((value as string).includes("spacing") && isInner) {
    return `var(--inner-${value})`;
  }

  return value;
};

const hiddenValue = (value: FlexCssProps["isHidden"]) => {
  return Boolean(value) ? "none" : "flex";
};
