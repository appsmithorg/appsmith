import { createStyleObject } from "@capsizecss/core";
import { css } from "styled-components";
import type { fontFamilyTypes, TypographyStyles } from "./types";
import { fontMetricsMap } from "./types";
import appleSystem from "@capsizecss/metrics/appleSystem";

export const getTypographyStyles = ({
  fontFamily,
  rootUnit,
  typography,
}: TypographyStyles) => {
  if (!typography) {
    return {
      body: css`
        ${createTypographyStyles(rootUnit * 2.5, rootUnit * 2)}
      `,
    };
  }

  const { body, footnote, heading } = typography;

  const headingStyles = heading
    ? createTypographyStyles(
        rootUnit * heading.capHeight,
        rootUnit * heading.lineGap,
        heading.fontFamily ?? fontFamily,
      )
    : "";

  const bodyStyles = body
    ? createTypographyStyles(
        rootUnit * body.capHeight,
        rootUnit * body.lineGap,
        body.fontFamily ?? fontFamily,
      )
    : "";

  const footnoteStyles = footnote
    ? createTypographyStyles(
        rootUnit * footnote.capHeight,
        rootUnit * footnote.lineGap,
        footnote.fontFamily ?? fontFamily,
      )
    : "";

  return {
    heading: css`
      ${headingStyles}
    `,
    body: css`
      ${bodyStyles}
    `,
    footnote: css`
      ${footnoteStyles}
    `,
  };
};

export const createTypographyStyles = (
  capHeight: number,
  lineGap: number,
  fontFamily?: fontFamilyTypes,
) => {
  // if there is no font family, use the default font stack
  if (!fontFamily) {
    const styles = createStyleObject({
      capHeight,
      lineGap,
      fontMetrics: appleSystem,
    });

    return {
      fontFamily: `-apple-system, BlinkMacSystemFont, "-apple-system Fallback: Segoe UI", "-apple-system Fallback: Roboto"`,
      ...styles,
    };
  }

  const styles = createStyleObject({
    capHeight,
    lineGap,
    fontMetrics: fontMetricsMap[fontFamily],
  });

  return {
    fontFamily: `"${fontFamily}"`,
    ...styles,
  };
};
