import { css } from "@emotion/css";

import type { FlexProps, Responsive } from "./types";

export const flexCss = ({
  alignItems,
  alignSelf,
  columnGap,
  direction,
  flex,
  flexBasis,
  flexGrow,
  flexShrink,
  gap,
  height,
  isHidden,
  justifyContent,
  justifySelf,
  margin,
  marginBottom,
  marginLeft,
  marginRight,
  marginTop,
  maxHeight,
  maxWidth,
  minHeight,
  minWidth,
  order,
  padding,
  paddingLeft,
  paddingRight,
  paddingTop,
  rowGap,
  width,
  wrap,
}: FlexProps) =>
  css([
    dimensionStyles("flex-wrap", wrap, flexWrapValue),
    dimensionStyles("justify-content", justifyContent),
    dimensionStyles("align-items", alignItems, flexAlignValue),
    dimensionStyles("gap", gap, cssVarValue),
    dimensionStyles("column-gap", columnGap),
    dimensionStyles("row-gap", rowGap),
    dimensionStyles("flex-direction", direction),
    dimensionStyles("flex", flex),
    dimensionStyles("flex-grow", flexGrow),
    dimensionStyles("flex-shrink", flexShrink),
    dimensionStyles("flex-basis", flexBasis, cssVarValue),
    dimensionStyles("justify-self", justifySelf),
    dimensionStyles("align-self", alignSelf),
    dimensionStyles("order", order),
    dimensionStyles("display", isHidden, hiddenValue),
    dimensionStyles("margin", margin, cssVarValue),
    dimensionStyles("margin-left", marginLeft, cssVarValue),
    dimensionStyles("margin-right", marginRight, cssVarValue),
    dimensionStyles("margin-top", marginTop, cssVarValue),
    dimensionStyles("padding", padding, cssVarValue),
    dimensionStyles("padding-left", paddingLeft, cssVarValue),
    dimensionStyles("padding-right", paddingRight, cssVarValue),
    dimensionStyles("padding-top", paddingTop, cssVarValue),
    dimensionStyles("margin-bottom", marginBottom, cssVarValue),
    dimensionStyles("width", width, cssVarValue),
    dimensionStyles("height", height, cssVarValue),
    dimensionStyles("min-width", minWidth, cssVarValue),
    dimensionStyles("min-height", minHeight, cssVarValue),
    dimensionStyles("max-width", maxWidth, cssVarValue),
    dimensionStyles("max-height", maxHeight, cssVarValue),
  ]);

// the value and returned callback value can be of any type in accordance with component props
const dimensionStyles = (
  cssProp: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback?: (value: any) => void,
) => {
  if (value == null) return;

  if (typeof value === "object" && !Array.isArray(value)) {
    return Object.keys(value).reduce((prev, current) => {
      if (current !== "base") {
        return (
          prev +
          `@container (min-width: ${current}) {
            && {
              ${cssProp}: ${
            callback ? callback(value[current]) : value[current]
          };
            }
          }`
        );
      } else {
        return prev + `${cssProp}: ${value[current]};`;
      }
    }, "");
  }

  return `${cssProp}: ${callback ? callback(value) : value};`;
};

const flexAlignValue = (
  value: Responsive<
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "self-start"
    | "self-end"
    | "baseline"
    | "first baseline"
    | "last baseline"
    | "safe center"
    | "unsafe center"
  >,
) => {
  if (value === "start") {
    return "flex-start";
  }

  if (value === "end") {
    return "flex-end";
  }

  return value;
};

const flexWrapValue = (
  value: Responsive<boolean | "wrap" | "nowrap" | "wrap-reverse">,
) => {
  if (typeof value === "boolean") {
    return value ? "wrap" : "nowrap";
  }

  return value;
};

const cssVarValue = (value: string) => {
  if (value == null) return;

  if (value.includes("spacing") || value.includes("sizing")) {
    return `var(--${value})`;
  }

  return value;
};

const hiddenValue = (value: boolean) => {
  return value ? "none" : "flex";
};

export const flexContainerCss = css`
  container-type: inline-size;
  display: flex;
  justify-content: center;
  width: 100%;
`;
