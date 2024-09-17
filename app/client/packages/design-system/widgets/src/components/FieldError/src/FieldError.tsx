import React from "react";
import { getTypographyClassName } from "@appsmith/wds-theming";
import clsx from "clsx";
import { FieldError as HeadlessFieldError } from "react-aria-components";
import styles from "./styles.module.css";
import type { FieldErrorProps } from "./types";

export const FieldError = (props: FieldErrorProps) => {
  const { errorMessage } = props;

  return (
    <HeadlessFieldError
      className={clsx(styles.errorText, getTypographyClassName("footnote"))}
    >
      {errorMessage}
    </HeadlessFieldError>
  );
};
