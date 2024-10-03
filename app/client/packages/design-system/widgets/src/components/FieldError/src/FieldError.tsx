import React from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import clsx from "clsx";
import { FieldError as AriaFieldError } from "react-aria-components";
import styles from "./styles.module.css";
import type { FieldErrorProps } from "./types";

export const FieldError = (props: FieldErrorProps) => {
  const { children } = props;

  if (!Boolean(children)) return null;

  return (
    <AriaFieldError
      className={clsx(styles.errorText, getTypographyClassName("footnote"))}
    >
      {children}
    </AriaFieldError>
  );
};
