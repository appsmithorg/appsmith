import { css } from "@emotion/css";
import kebabCase from "lodash/kebabCase";

import type { FlexCssProps, CssVarValues } from "./types";

export const flexCss = (props: FlexCssProps) => {
  return css`
    ${Object.keys(props).reduce(
      (styles, key) =>
        styles + flexStyles(key, props[key as keyof FlexCssProps]),
      "",
    )}
  `;
};

const flexStyles = (
  cssProp: string,
  value: FlexCssProps[keyof FlexCssProps],
) => {
  if (value == null) return;

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
  callback?: (value: T) => void,
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
            callback ? callback(value[current]) : value[current]
          };}}`
        );
      } else {
        //@ts-expect-error: type mismatch
        return prev + `${cssProp}: ${value[current]};`;
      }
    }, "");
  }

  return `${cssProp}: ${callback ? callback(value) : value};`;
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

const cssVarValue = (value: CssVarValues) => {
  if (value == null) return;

  if ((value as string).includes("sizing")) {
    return `var(--${value})`;
  }

  if ((value as string).includes("spacing")) {
    return `var(--outer-${value})`;
  }

  return value;
};

const hiddenValue = (value: FlexCssProps["isHidden"]) => {
  return Boolean(value) ? "none" : "flex";
};
