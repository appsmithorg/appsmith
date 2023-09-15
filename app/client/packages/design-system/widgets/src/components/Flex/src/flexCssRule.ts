import kebabCase from "lodash/kebabCase";

import type { Responsive, FlexProps } from "./types";

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

const isObjectProp = (prop?: string | number | boolean | object | null) => {
  return typeof prop === "object" && !Array.isArray(prop);
};

const getProps = (props: FlexProps) => {
  let simpleProps = {};
  let containerProps = {};

  Object.keys(props).forEach((key) => {
    if (!isObjectProp(props[key as keyof FlexProps])) {
      simpleProps = {
        ...simpleProps,
        [key]: props[key as keyof FlexProps],
      };
    }
  });

  Object.keys(props).forEach((key) => {
    if (isObjectProp(props[key as keyof FlexProps])) {
      simpleProps = {
        ...simpleProps,
        // @ts-expect-error type mismatch
        [key]: props[key as keyof FlexProps]["base"],
      };
      containerProps = {
        ...containerProps,
        [key]: props[key as keyof FlexProps],
      };
    }
  });

  return { simpleProps, containerProps };
};

const simpleCss = (className: string, props: FlexProps) => {
  const { simpleProps } = getProps(props);
  let styles = "";

  Object.keys(simpleProps).forEach(
    // @ts-expect-error type mismatch
    (key) => (styles += simpleStyles(key, simpleProps[key])),
  );

  return `.${className} {${styles}}`;
};

const containerCss = (className: string, props: FlexProps) => {
  const { containerProps } = getProps(props);
  let styles = "";

  Object.keys(containerProps).forEach(
    (key) =>
      (styles += containerStyles(
        className,
        key,
        // @ts-expect-error type mismatch
        containerProps[key],
      )),
  );

  return styles;
};

// the value can be of any type in accordance with flex component props
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const simpleStyles = (cssProp: string, value: any) => {
  if (value == null) return;

  switch (true) {
    case cssProp === "wrap":
      return `flex-wrap: ${flexWrapValue(value)};`;
    case cssProp === "isHidden":
      return `display: ${hiddenValue(value)};`;
    case cssProp === "flexAlignValue":
      return `align-items: ${flexAlignValue(value)};`;
    case cssProp === "direction":
      return `flex-direction: ${value};`;
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
      cssProp === "marginBottom" ||
      cssProp === "width" ||
      cssProp === "height" ||
      cssProp === "minWidth" ||
      cssProp === "minHeight" ||
      cssProp === "maxWidth" ||
      cssProp === "maxHeight":
      return `${kebabCase(cssProp)}: ${cssVarValue(value)};`;
    default:
      return `${kebabCase(cssProp)}: ${value};`;
  }
};

const containerStyles = (
  flexClassName: string,
  cssProp: string,
  // the value can be of any type in accordance with flex component props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any,
) => {
  let styles = "";

  Object.keys(value).forEach((key) => {
    if (key !== "base") {
      return (styles += `@container (min-width: ${key}) {.${flexClassName} {${simpleStyles(
        cssProp,
        value[key],
      )}}}`);
    }
  });

  return styles;
};

export const flexCssRule = (className: string, props: FlexProps) =>
  `${simpleCss(className, props)} ${containerCss(className, props)}`;
