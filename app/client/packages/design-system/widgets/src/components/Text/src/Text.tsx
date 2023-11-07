import clsx from "clsx";
import {
  getTypographyClassName,
  type TYPOGRAPHY_FONT_WEIGHTS,
} from "@design-system/theming";
import type { Ref } from "react";
import React, { forwardRef } from "react";

import type { TextProps } from "./types";
import styles from "./styles.module.css";

const _Text = (props: TextProps, ref: Ref<HTMLParagraphElement>) => {
  const {
    children,
    className,
    color,
    fontWeight,
    isBold = false,
    isItalic = false,
    lineClamp,
    textAlign = "left",
    title,
    variant = "body",
    ...rest
  } = props;

  const getFontWeight = (
    fontWeight?: keyof typeof TYPOGRAPHY_FONT_WEIGHTS,
    isBold = false,
  ) => {
    if (fontWeight) return fontWeight;

    return isBold ? "bold" : "inherit";
  };

  return (
    <div
      className={clsx(className, styles.text, getTypographyClassName(variant))}
      data-color={color ? color : undefined}
      ref={ref}
      style={{
        fontWeight: getFontWeight(fontWeight, isBold),
        fontStyle: isItalic ? "italic" : "normal",
        textAlign,
      }}
      {...rest}
    >
      <span
        className={styles.clampedText}
        style={{ WebkitLineClamp: lineClamp }}
        title={title}
      >
        {children}
      </span>
    </div>
  );
};

export const Text = forwardRef(_Text);
