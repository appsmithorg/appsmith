/* eslint-disable no-console */
import styled from "styled-components";

import type { Responsive, StyledFlexProps } from "./types";

export const StyledFlex = styled.div<StyledFlexProps>`
  ${({ $wrap }) => {
    return containerDimensionStyles("flex-wrap", $wrap, flexWrapValue);
  }}

  ${({ $justifyContent }) => {
    return containerDimensionStyles("justify-content", $justifyContent);
  }}

  ${({ $alignContent }) => {
    return containerDimensionStyles(
      "align-content",
      $alignContent,
      flexAlignValue,
    );
  }}

  ${({ $alignItems }) => {
    return containerDimensionStyles("align-items", $alignItems, flexAlignValue);
  }}

  ${({ $gap }) => {
    return containerDimensionStyles("gap", $gap, cssVarValue);
  }}

  ${({ $columnGap }) => {
    return containerDimensionStyles("column-gap", $columnGap);
  }}

  ${({ $rowGap }) => {
    return containerDimensionStyles("row-gap", $rowGap);
  }}

  ${({ $direction }) => {
    return containerDimensionStyles("flex-direction", $direction);
  }}

  ${({ $flex }) => {
    return containerDimensionStyles("flex", $flex);
  }}

  ${({ $flexGrow }) => {
    return containerDimensionStyles("flex-grow", $flexGrow);
  }}

  ${({ $flexShrink }) => {
    return containerDimensionStyles("flex-shrink", $flexShrink);
  }}

  ${({ $flexBasis }) => {
    return containerDimensionStyles("flex-basis", $flexBasis, cssVarValue);
  }}

  ${({ $justifySelf }) => {
    return containerDimensionStyles("justify-self", $justifySelf);
  }}

  ${({ $alignSelf }) => {
    return containerDimensionStyles("align-self", $alignSelf);
  }}

  ${({ $order }) => {
    return containerDimensionStyles("order", $order);
  }}

  ${({ $isHidden }) => {
    return containerDimensionStyles("display", $isHidden, hiddenValue);
  }}

  ${({ $margin }) => {
    return containerDimensionStyles("margin", $margin, cssVarValue);
  }}

  ${({ $marginLeft }) => {
    return containerDimensionStyles("margin-left", $marginLeft, cssVarValue);
  }}

  ${({ $marginRight }) => {
    return containerDimensionStyles("margin-right", $marginRight, cssVarValue);
  }}

  ${({ $marginTop }) => {
    return containerDimensionStyles("margin-top", $marginTop, cssVarValue);
  }}

  ${({ $padding }) => {
    return containerDimensionStyles("padding", $padding, cssVarValue);
  }}

  ${({ $paddingLeft }) => {
    return containerDimensionStyles("padding-left", $paddingLeft, cssVarValue);
  }}

  ${({ $paddingRight }) => {
    return containerDimensionStyles(
      "padding-right",
      $paddingRight,
      cssVarValue,
    );
  }}

  ${({ $paddingTop }) => {
    return containerDimensionStyles("padding-top", $paddingTop, cssVarValue);
  }}

  ${({ $marginBottom }) => {
    return containerDimensionStyles(
      "margin-bottom",
      $marginBottom,
      cssVarValue,
    );
  }}

  ${({ $width }) => {
    return containerDimensionStyles("width", $width, cssVarValue);
  }}

  ${({ $height }) => {
    return containerDimensionStyles("height", $height, cssVarValue);
  }}

  ${({ $minWidth }) => {
    return containerDimensionStyles("min-width", $minWidth, cssVarValue);
  }}

  ${({ $minHeight }) => {
    return containerDimensionStyles("min-height", $minHeight, cssVarValue);
  }}

  ${({ $maxWidth }) => {
    return containerDimensionStyles("max-width", $maxWidth, cssVarValue);
  }}

  ${({ $maxHeight }) => {
    return containerDimensionStyles("max-height", $maxHeight, cssVarValue);
  }}
`;

// the value and returned callback value can be of any type in accordance with component props
const containerDimensionStyles = (
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
  console.log("####", { value });
  if (value.includes("spacing") || value.includes("sizing")) {
    return `var(--${value})`;
  }

  return value;
};

const hiddenValue = (value: boolean) => {
  return value ? "none" : "flex";
};

export const StyledContainerFlex = styled.div`
  container-type: inline-size;
  display: flex;
  justify-content: center;
  width: 100%;
`;
