import { getTypographyClassName } from "@design-system/theming";
import React, { forwardRef } from "react";
import styles from "./styles.module.css";
import clsx from "clsx";

import type { TYPOGRAPHY_FONT_WEIGHTS } from "@design-system/theming";
import type { Ref } from "react";
import type { TextProps } from "./types";

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
    variant = "body",
    ...rest
  } = props;

  const getFontWeight = (
    fontWeight?: keyof typeof TYPOGRAPHY_FONT_WEIGHTS,
    isBold?: boolean,
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
      >
        {children}
      </span>
    </div>
  );
};

export const Text = forwardRef(_Text);
